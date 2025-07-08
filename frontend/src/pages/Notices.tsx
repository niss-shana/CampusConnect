import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Bell, 
  Calendar, 
  Edit, 
  Trash2, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const Notices = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/notices');
      setNotices(response.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setMessage({ type: 'error', text: 'Failed to load notices' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (editingNotice) {
        console.log("Editing Notice ID:", editingNotice?.id);
        await axios.put(`http://localhost:3001/api/notices/${editingNotice.id}`, formData);
        setMessage({ type: 'success', text: 'Notice updated successfully' });
      } else {
        await axios.post('http://localhost:3001/api/notices', formData);
        setMessage({ type: 'success', text: 'Notice created successfully' });
      }

      setShowModal(false);
      setEditingNotice(null);
      setFormData({ title: '', content: '', priority: 'normal' });
      fetchNotices();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save notice' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    try {
      await axios.delete(`http://localhost:3001/api/notices/${id}`);
      setMessage({ type: 'success', text: 'Notice deleted successfully' });
      fetchNotices();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete notice' 
      });
    }
  };

  const openModal = (notice = null) => {
    if (notice) {
      console.log("Editing Notice:", notice); // Debug log
      setEditingNotice({
        ...notice,
        id: notice._id || notice.id // Use _id if available, fallback to id
      });
      setFormData({
        title: notice.title,
        content: notice.content,
        priority: notice.priority
      });
    } else {
      setEditingNotice(null);
      setFormData({ title: '', content: '', priority: 'normal' });
    }
    setShowModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (loading && notices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading notices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-900">Notices</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Create Notice</span>
          </button>
        )}
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

      {/* Notices List */}
      <div className="grid gap-4">
        {notices.length > 0 ? (
          notices.map((notice) => (
            <div key={notice.id} className="bg-white p-6 rounded-xl shadow-soft">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getPriorityIcon(notice.priority)}</span>
                    <h3 className="text-lg font-semibold text-primary-900">
                      {notice.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notice.priority)}`}>
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-primary-700 whitespace-pre-wrap">{notice.content}</p>
                </div>
                
                {user?.role === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal(notice)}
                      className="flex items-center space-x-1 bg-accent-600 text-white px-3 py-1 rounded text-sm hover:bg-accent-700 transition-colors duration-200"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(notice._id || notice.id)}
                      className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors duration-200"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-primary-500 border-t pt-4">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Bell className="h-4 w-4" />
                  <span>By {notice.createdBy}</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-primary-400 mx-auto mb-4" />
            <p className="text-primary-600">No notices found</p>
          </div>
        )}
      </div>

      {/* Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-strong max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-900">
                {editingNotice ? 'Edit Notice' : 'Create Notice'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-primary-500 hover:text-primary-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingNotice ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;