import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  Calendar, 
  Award, 
  Trash2, 
  Edit,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Download,
  Clock,
  Users,
  Star
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

interface UploadFormData {
  title: string;
  description: string;
  totalMarks: string;
  dueDate: string;
  file: File | null;
}

const AdminAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    title: '',
    description: '',
    totalMarks: '100',
    dueDate: '',
    file: null
  });

  const [editForm, setEditForm] = useState<UploadFormData>({
    title: '',
    description: '',
    totalMarks: '100',
    dueDate: '',
    file: null
  });

  const [gradeForm, setGradeForm] = useState({
    marks: '',
    feedback: ''
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('totalMarks', uploadForm.totalMarks);
      formData.append('dueDate', uploadForm.dueDate);
      if (uploadForm.file) {
        formData.append('file', uploadForm.file);
      }

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/api/assignments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage({ type: 'success', text: 'Assignment created successfully' });
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', totalMarks: '100', dueDate: '', file: null });
      fetchAssignments();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create assignment' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentId = (a: Assignment | null) => (a ? (a as any).id ?? (a as any)._id : undefined);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !selectedSubmission) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const aid = getAssignmentId(selectedAssignment);
      await axios.post(
        `http://localhost:3001/api/assignments/${aid}/submissions/${selectedSubmission.id}/grade`,
        {
          marks: parseInt(gradeForm.marks),
          feedback: gradeForm.feedback
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setMessage({ type: 'success', text: 'Assignment graded successfully' });
      setShowGradeModal(false);
      setGradeForm({ marks: '', feedback: '' });
      setSelectedAssignment(null);
      setSelectedSubmission(null);
      fetchAssignments();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to grade assignment' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This will also delete all submissions.')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/assignments/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Assignment deleted successfully' });
      fetchAssignments();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete assignment' 
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

  const openEditModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditForm({
      title: assignment.title,
      description: assignment.description,
      totalMarks: assignment.totalMarks.toString(),
      dueDate: assignment.dueDate.substring(0,16), // ISO -> input value
      file: null
    });
    setShowEditModal(true);
  };

  const openGradeModal = (assignment: Assignment, submission: AssignmentSubmission) => {
    setSelectedAssignment(assignment);
    setSelectedSubmission(submission);
    setGradeForm({
      marks: submission.marks?.toString() || '',
      feedback: submission.feedback || ''
    });
    setShowGradeModal(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('description', editForm.description);
      formData.append('totalMarks', editForm.totalMarks);
      formData.append('dueDate', editForm.dueDate);
      if (editForm.file) {
        formData.append('file', editForm.file);
      }

      const token = localStorage.getItem('token');
      const aid = getAssignmentId(selectedAssignment);
      await axios.put(`http://localhost:3001/api/assignments/${aid}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage({ type: 'success', text: 'Assignment updated successfully' });
      setShowEditModal(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update assignment'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStats = (assignment: Assignment) => {
    const totalSubmissions = assignment.submissions?.length || 0;
    const gradedSubmissions = assignment.submissions?.filter(s => s.marks !== undefined).length || 0;
    const avgGrade = assignment.submissions?.filter(s => s.marks !== undefined)
      .reduce((sum, s) => sum + (s.marks || 0), 0) / (gradedSubmissions || 1);

    return { totalSubmissions, gradedSubmissions, avgGrade: gradedSubmissions > 0 ? avgGrade : 0 };
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
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Assignment Management</h1>
          <p className="text-primary-600 mt-1">Create, manage, and grade student assignments</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Create Assignment</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{assignments.length}</p>
              <p className="text-primary-600 text-sm">Total Assignments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">
                {assignments.reduce((sum, a) => sum + (a.submissions?.length || 0), 0)}
              </p>
              <p className="text-primary-600 text-sm">Total Submissions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">
                {assignments.reduce((sum, a) => sum + (a.submissions?.filter(s => s.marks !== undefined).length || 0), 0)}
              </p>
              <p className="text-primary-600 text-sm">Graded Submissions</p>
            </div>
          </div>
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
            const stats = getSubmissionStats(assignment);
            
            return (
              <div key={assignment.id} className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-primary-900">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(assignment)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                          title="Edit Assignment"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete Assignment"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-primary-600 mb-4 leading-relaxed">{assignment.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
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
                      <div className="flex items-center text-primary-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="font-medium">{stats.totalSubmissions} Submissions</span>
                      </div>
                      {stats.gradedSubmissions > 0 && (
                        <div className="flex items-center text-green-600">
                          <Star className="h-4 w-4 mr-2" />
                          <span className="font-medium">Avg: {stats.avgGrade.toFixed(1)}/{assignment.totalMarks}</span>
                        </div>
                      )}
                    </div>

                    {/* Assignment File Download */}
                    {assignment.file && (
                      <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-primary-600" />
                            <span className="text-sm font-medium text-primary-700">Assignment File</span>
                          </div>
                          <a
                            href={assignment.file}
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

                {/* Submissions Section */}
                {assignment.submissions && assignment.submissions.length > 0 && (
                  <div className="border-t border-primary-100 pt-6">
                    <h4 className="font-semibold text-primary-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Student Submissions ({assignment.submissions.length})
                    </h4>
                    <div className="space-y-3">
                      {assignment.submissions.map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between bg-primary-50 p-4 rounded-lg border border-primary-200">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-primary-900">{submission.studentName}</p>
                                <p className="text-sm text-primary-600">
                                  Submitted: {formatDate(submission.submittedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                {submission.marks !== undefined ? (
                                  <div>
                                    <p className="font-semibold text-green-600 text-lg">
                                      {submission.marks}/{assignment.totalMarks}
                                    </p>
                                    <p className="text-xs text-green-500">
                                      {Math.round((submission.marks / assignment.totalMarks) * 100)}%
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-orange-600 font-medium text-sm px-3 py-1 bg-orange-50 rounded-full border border-orange-200">
                                    PENDING GRADE
                                  </span>
                                )}
                              </div>
                            </div>
                            {submission.feedback && (
                              <p className="text-sm text-primary-600 mt-2 bg-white p-2 rounded border">
                                <span className="font-medium">Feedback:</span> {submission.feedback}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => openGradeModal(assignment, submission)}
                              className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                              title={submission.marks !== undefined ? "Edit Grade" : "Grade Submission"}
                            >
                              <Award className="h-5 w-5" />
                            </button>
                            <a
                              href={submission.submissionFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                              title="Download Submission"
                            >
                              <Download className="h-5 w-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Submissions State */}
                {(!assignment.submissions || assignment.submissions.length === 0) && (
                  <div className="border-t border-primary-100 pt-6">
                    <div className="text-center py-8 bg-primary-50 rounded-lg border border-primary-200">
                      <Users className="h-12 w-12 text-primary-300 mx-auto mb-3" />
                      <p className="text-primary-600 font-medium">No submissions yet</p>
                      <p className="text-primary-500 text-sm">Students haven't submitted their work for this assignment</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-primary-100">
            <FileText className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-primary-900 mb-2">No Assignments Created</h3>
            <p className="text-primary-600 mb-6">
              Start by creating your first assignment for students
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors duration-200 font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Create Assignment</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-900">Create New Assignment</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Math Assignment 1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the assignment requirements..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={uploadForm.totalMarks}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, totalMarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={uploadForm.dueDate}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Assignment File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setUploadForm(prev => ({ ...prev, file: files[0] }));
                    }
                  }}
                  className="w-full p-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Upload instructions, templates, or reference materials
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Assignment Modal */}
      {showGradeModal && selectedAssignment && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-900">
                {selectedSubmission.marks !== undefined ? 'Edit Grade' : 'Grade Submission'}
              </h3>
              <button
                onClick={() => {
                  setShowGradeModal(false);
                  setSelectedAssignment(null);
                  setSelectedSubmission(null);
                }}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <h4 className="font-medium text-primary-900">{selectedAssignment.title}</h4>
              <p className="text-sm text-primary-600">Student: {selectedSubmission.studentName}</p>
              <p className="text-sm text-primary-600">Submitted: {formatDate(selectedSubmission.submittedAt)}</p>
              <div className="mt-2">
                <a
                  href={selectedSubmission.submissionFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>View Submission</span>
                </a>
              </div>
            </div>

            <form onSubmit={handleGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Marks (0-{selectedAssignment.totalMarks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignment.totalMarks}
                  value={gradeForm.marks}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, marks: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter marks"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Feedback for Student
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Provide detailed feedback to help the student improve..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowGradeModal(false);
                    setSelectedAssignment(null);
                    setSelectedSubmission(null);
                  }}
                  className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-900">Edit Assignment</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAssignment(null);
                }}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={editForm.totalMarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, totalMarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Replace Assignment File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setEditForm(prev => ({ ...prev, file: files[0] }));
                    }
                  }}
                  className="w-full p-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                />
                <p className="text-xs text-primary-500 mt-1">
                  Leave empty to keep the current file
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAssignment(null);
                  }}
                  className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;