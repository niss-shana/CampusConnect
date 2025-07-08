import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Upload, 
  FileText, 
  Calendar, 
  Award, 
  Trash2, 
  X,
  AlertCircle,
  CheckCircle,
  Download,
  Clock
} from 'lucide-react';
import axios from 'axios';

interface Assignment {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
  dueDate: string;
  file?: string;
  fileName?: string;
  createdAt: string;
  submissions?: AssignmentSubmission[];
}

interface AssignmentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  submissionFile: string;
  submittedAt: string;
  marks?: number;
  feedback?: string;
  gradedAt?: string;
}

interface SubmissionFormData {
  file: File | null;
}

const StudentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [submissionForm, setSubmissionForm] = useState<SubmissionFormData>({
    file: null
  });

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get<Assignment[]>('http://localhost:3001/api/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setMessage({ type: 'error', text: 'Failed to load assignments' });
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentId = (a: Assignment | null) => (a ? (a as any).id ?? (a as any)._id : undefined);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionForm.file) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', submissionForm.file);

      const token = localStorage.getItem('token');
      const aid = getAssignmentId(selectedAssignment);
      
      await axios.post(
        `http://localhost:3001/api/assignments/${aid}/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessage({ type: 'success', text: 'Assignment submitted successfully' });
      setShowSubmitModal(false);
      setSubmissionForm({ file: null });
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to submit assignment'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (assignmentId: string, submissionId: string) => {
    if (!confirm('Are you sure you want to delete your submission? This action cannot be undone.')) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/assignments/${assignmentId}/submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Submission deleted successfully' });
      fetchAssignments();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete submission' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getUserSubmission = (assignment: Assignment) => {
    if (!user) return null;
    
    if (!assignment.submissions || assignment.submissions.length === 0) {
      return null;
    }
    
    // Try multiple ways to find the user's submission
    const userSubmission = assignment.submissions.find(s => {
      // Handle different ID formats and field names
      const submissionStudentId = s.studentId || s.student_id || s.userId || s.user_id;
      const currentUserId = user.id || user._id || user.userId;
      
      return submissionStudentId == currentUserId || // Loose equality to handle string/number mismatch
             submissionStudentId?.toString() === currentUserId?.toString();
    });
    
    return userSubmission || null;
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const userSubmission = getUserSubmission(assignment);
    if (!userSubmission) {
      if (isOverdue(assignment.dueDate)) {
        return (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-600 font-semibold text-sm px-3 py-1 bg-red-50 rounded-full border border-red-200">
              OVERDUE
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-orange-600 font-semibold text-sm px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
            NOT SUBMITTED
          </span>
        </div>
      );
    }
    
    if (userSubmission.marks !== undefined) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-600 font-semibold text-sm px-3 py-1 bg-green-50 rounded-full border border-green-200">
            GRADED ({userSubmission.marks}/{assignment.totalMarks})
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-blue-600 font-semibold text-sm px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
          SUBMITTED
        </span>
      </div>
    );
  };

  const canSubmitAssignment = (assignment: Assignment) => {
    if (isOverdue(assignment.dueDate)) return false;
    const userSubmission = getUserSubmission(assignment);
    return !userSubmission; // Can only submit if no previous submission
  };

  const canDeleteSubmission = (assignment: Assignment) => {
    const userSubmission = getUserSubmission(assignment);
    return userSubmission && userSubmission.marks === undefined; // Can delete only if not graded
  };

  const buildFileUrl = (path: string | undefined) => {
    if (!path) return '#';
    // If already absolute URL, return as is
    if (/^https?:\/\//i.test(path)) return path;
    const sanitized = path.replace(/\\/g, '/');
    return `http://localhost:3001/${sanitized}`;
  };

  if (loading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-900">My Assignments</h1>
        <div className="text-sm text-primary-600">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} total
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Assignments List */}
      <div className="grid gap-6">
        {assignments.length > 0 ? (
          assignments.map((assignment) => {
            const userSubmission = getUserSubmission(assignment);
            
            return (
              <div key={assignment.id} className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-primary-900">
                        {assignment.title}
                      </h3>
                      {getSubmissionStatus(assignment)}
                    </div>
                    
                    <p className="text-primary-600 mb-4 leading-relaxed">{assignment.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center text-primary-500">
                        <Award className="h-4 w-4 mr-2" />
                        <span className="font-medium">Total Marks: {assignment.totalMarks}</span>
                      </div>
                      <div className="flex items-center text-primary-500">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className={`font-medium ${isOverdue(assignment.dueDate) ? 'text-red-600' : ''}`}>
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </div>

                    {/* Assignment File Download */}
                    {assignment.file && (
                      <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-primary-600" />
                            <span className="text-sm font-medium text-primary-700">Assignment File</span>
                          </div>
                          <a
                            href={buildFileUrl(assignment.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </a>
                        </div>
                        {assignment.fileName && (
                          <p className="text-xs text-primary-500 mt-1">{assignment.fileName}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                {canSubmitAssignment(assignment) && (
                  <div className="mt-6 pt-4 border-t border-primary-100">
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmitModal(true);
                      }}
                      className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 font-medium"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Submit Assignment</span>
                    </button>
                  </div>
                )}

                {/* Student's Submission Display */}
                {userSubmission && (
                  <div className="mt-6 border-t border-primary-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-primary-900 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        Your Submission
                      </h4>
                      <div className="flex items-center space-x-2">
                        <a
                          href={buildFileUrl(userSubmission.submissionFile)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200 border border-primary-200"
                          title="View your submission"
                        >
                          <Download className="h-4 w-4" />
                          <span className="text-sm font-medium">View File</span>
                        </a>
                        {canDeleteSubmission(assignment) && (
                          <button
                            onClick={() => handleDeleteSubmission(assignment.id, userSubmission.id)}
                            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200"
                            title="Delete your submission"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-5">
                      {/* Submission Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-xs text-primary-500 uppercase tracking-wide font-medium">Submitted On</p>
                            <p className="text-primary-900 font-semibold">{formatDate(userSubmission.submittedAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-primary-500 uppercase tracking-wide font-medium">Status</p>
                            <p className="text-primary-900 font-semibold">
                              {userSubmission.marks !== undefined ? 'Graded' : 'Under Review'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Grade Section */}
                      {userSubmission.marks !== undefined ? (
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Award className="h-5 w-5 text-green-600" />
                              <span className="text-sm font-medium text-green-600 uppercase tracking-wide">Final Grade</span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {userSubmission.marks}<span className="text-lg text-green-500">/{assignment.totalMarks}</span>
                              </div>
                              <div className="text-sm text-green-600 font-medium">
                                {Math.round((userSubmission.marks / assignment.totalMarks) * 100)}%
                              </div>
                            </div>
                          </div>

                          {userSubmission.feedback && (
                            <div className="border-t border-green-100 pt-3">
                              <p className="text-xs text-green-600 uppercase tracking-wide font-medium mb-2">
                                Instructor Feedback
                              </p>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-green-800 text-sm leading-relaxed">
                                  {userSubmission.feedback}
                                </p>
                              </div>
                            </div>
                          )}

                          {userSubmission.gradedAt && (
                            <div className="mt-3 pt-3 border-t border-green-100">
                              <p className="text-xs text-green-500 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Graded on {formatDate(userSubmission.gradedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-blue-900 font-semibold">Awaiting Grade</p>
                              <p className="text-blue-600 text-sm">Your submission is being reviewed by the instructor</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submission Actions Note */}
                      {canDeleteSubmission(assignment) && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                              <p className="font-medium">You can still modify your submission</p>
                              <p className="text-yellow-700">Delete this submission to upload a new version before grading begins.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-primary-100">
            <FileText className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-primary-900 mb-2">No Assignments Yet</h3>
            <p className="text-primary-600">
              Your instructor hasn't posted any assignments yet. Check back later!
            </p>
          </div>
        )}
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-900">Submit Assignment</h3>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedAssignment(null);
                }}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-primary-900">{selectedAssignment.title}</h4>
              <p className="text-sm text-primary-600 mt-1">Due: {formatDate(selectedAssignment.dueDate)}</p>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You can only submit once. If you need to make changes, 
                  you'll need to delete this submission first (only possible before grading).
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Your Submission File
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setSubmissionForm({ file: files[0] });
                    }
                  }}
                  className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                  required
                />
                <p className="text-xs text-primary-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, PPT, PPTX
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !submissionForm.file}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;