import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Mail,
  Calendar,
  UserCheck
} from 'lucide-react';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users/students');
      const formattedStudents = response.data.map((student: any) => ({
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt,
        lastLogin: student.lastLogin
      }));
      
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.delete(`http://localhost:3001/api/students/${selectedStudent.id}`);
      setMessage({ type: 'success', text: 'Student deleted successfully' });
      setShowDeleteModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete student' 
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
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

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Student Management</h1>
          <p className="text-primary-600 mt-1">View and manage registered students</p>
        </div>
        <div className="text-primary-600">
          <span className="text-2xl font-bold">{students.length}</span> Total Students
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-soft border border-primary-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{students.length}</p>
              <p className="text-primary-600 text-sm">Total Students</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">{filteredStudents.length}</p>
              <p className="text-primary-600 text-sm">Filtered Results</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-soft border border-primary-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-900">
                {students.filter(s => new Date(s.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length}
              </p>
              <p className="text-primary-600 text-sm">New This Month</p>
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

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-soft border border-primary-100">
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-100">
                  <th className="text-left p-4 font-semibold text-primary-900">Student</th>
                  <th className="text-left p-4 font-semibold text-primary-900">Email</th>
                  <th className="text-left p-4 font-semibold text-primary-900">Joined</th>
                  <th className="text-left p-4 font-semibold text-primary-900">Last Login</th>
                  <th className="text-center p-4 font-semibold text-primary-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-primary-50 hover:bg-primary-25 transition-colors duration-200">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-primary-700">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-primary-900">{student.name}</p>
                          <p className="text-sm text-primary-500 capitalize">{student.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-primary-400" />
                        <span className="text-primary-700">{student.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary-400" />
                        <span className="text-primary-700">{formatDate(student.createdAt)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-primary-700">
                        {student.lastLogin ? formatDate(student.lastLogin) : 'Never'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openDeleteModal(student)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete Student"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="h-16 w-16 text-primary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary-900 mb-2">
              {searchTerm ? 'No students found' : 'No students registered'}
            </h3>
            <p className="text-primary-600">
              {searchTerm 
                ? `No students match "${searchTerm}". Try a different search term.`
                : 'No students have registered yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-primary-900">Delete Student</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStudent(null);
                }}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Are you sure you want to delete this student?</p>
                  <p className="text-sm text-red-700 mt-1">This action cannot be undone.</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary-700 text-lg">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-primary-900">{selectedStudent.name}</p>
                    <p className="text-sm text-primary-600">{selectedStudent.email}</p>
                    <p className="text-xs text-primary-500">
                      Joined: {formatDate(selectedStudent.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 font-medium"
              >
                {loading ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;