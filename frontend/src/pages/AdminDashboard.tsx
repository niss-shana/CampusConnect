import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Bell, 
  TrendingUp, 
  Award,
  Clock,
  BookOpen,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    pendingGrading: 0,
    totalNotices: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get API base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [studentsRes, assignmentsRes, noticesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/students`, { headers }),
        axios.get(`${API_BASE_URL}/assignments`, { headers }),
        axios.get(`${API_BASE_URL}/notices`, { headers })
      ]);

      const students = Array.isArray(studentsRes.data) ? studentsRes.data : [];
      const assignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
      const notices = Array.isArray(noticesRes.data) ? noticesRes.data : [];

      console.log('Dashboard data fetched:', {
        students: students.length,
        assignments: assignments.length,
        notices: notices.length
      });

      // Calculate pending grading - assignments with submissions but no grades
      const pendingGrading = assignments.filter(assignment => {
        if (!assignment.submissions || assignment.submissions.length === 0) {
          return false; // No submissions to grade
        }
        // Check if any submission is ungraded
        return assignment.submissions.some(submission => 
          submission.marks === undefined || 
          submission.marks === null || 
          submission.marks === ''
        );
      }).length;

      setStats({
        totalStudents: students.length,
        totalAssignments: assignments.length,
        pendingGrading: pendingGrading,
        totalNotices: notices.length
      });

      // Get recent assignments (all assignments, not just with submissions) - limit to 4
      const recentAssignmentsData = assignments
        .sort((a, b) => new Date(b.createdAt || b.dateCreated || 0) - new Date(a.createdAt || a.dateCreated || 0))
        .slice(0, 4); // Show max 4 recent assignments

      setRecentAssignments(recentAssignmentsData);

      // Get recent students - limit to 4
      const recentStudentsData = students
        .sort((a, b) => new Date(b.createdAt || b.dateCreated || 0) - new Date(a.createdAt || a.dateCreated || 0))
        .slice(0, 4); // Show max 4 recent students

      setRecentStudents(recentStudentsData);

      console.log('Recent assignments:', recentAssignmentsData);
      console.log('Recent students:', recentStudentsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    subtitle 
  }) => (
    <div className="bg-white p-4 rounded-lg shadow-soft hover:shadow-medium transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-primary-600">{title}</p>
          <p className="text-xl font-bold text-primary-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-primary-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Date error';
    }
  };

  const getAssignmentStatus = (assignment) => {
    if (!assignment.submissions || assignment.submissions.length === 0) {
      return {
        text: 'No Submissions',
        color: 'text-gray-600',
        icon: null
      };
    }

    const hasGradedSubmissions = assignment.submissions.some(s => 
      s.marks !== undefined && s.marks !== null && s.marks !== ''
    );
    const hasUngradedSubmissions = assignment.submissions.some(s => 
      s.marks === undefined || s.marks === null || s.marks === ''
    );

    if (hasUngradedSubmissions) {
      return {
        text: 'Pending Review',
        color: 'text-orange-600',
        icon: AlertTriangle
      };
    } else if (hasGradedSubmissions) {
      return {
        text: 'All Graded',
        color: 'text-green-600',
        icon: null
      };
    } else {
      return {
        text: 'No Submissions',
        color: 'text-gray-600',
        icon: null
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-900 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-primary-200">Manage your campus portal</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Stats Grid - Made smaller */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-blue-600"
          subtitle="Registered users"
        />
        <StatCard
          title="Total Assignments"
          value={stats.totalAssignments}
          icon={FileText}
          color="bg-accent-600"
          subtitle="Created"
        />
        <StatCard
          title="Pending Grading"
          value={stats.pendingGrading}
          icon={Clock}
          color="bg-orange-600"
          subtitle="Needs attention"
        />
        <StatCard
          title="Total Notices"
          value={stats.totalNotices}
          icon={Bell}
          color="bg-green-600"
          subtitle="Published"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <div className="bg-white p-6 rounded-xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Recent Assignments</h2>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary-600" />
              <a 
                href="/admin/assignments" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
          <div className="space-y-4">
            {recentAssignments.length > 0 ? (
              recentAssignments.map((assignment, index) => {
                const status = getAssignmentStatus(assignment);
                const StatusIcon = status.icon;
                
                return (
                  <div key={assignment._id || assignment.id || index} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-primary-900">{assignment.title || 'Untitled Assignment'}</h3>
                      <p className="text-sm text-primary-600">
                        Due: {formatDate(assignment.dueDate)}
                      </p>
                      <p className="text-xs text-primary-500">
                        {assignment.submissions?.length || 0} submission{(assignment.submissions?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${status.color} flex items-center`}>
                        {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                        {status.text}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-primary-300 mx-auto mb-4" />
                <p className="text-primary-500">No assignments created yet</p>
                <p className="text-sm text-primary-400">Create your first assignment to see it here</p>
              </div>
            )}
          </div>
          {recentAssignments.length === 4 && (
            <div className="mt-4 pt-4 border-t border-primary-100">
              <a 
                href="/admin/assignments" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center"
              >
                View All Assignments <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          )}
        </div>

        {/* Recent Students */}
        <div className="bg-white p-6 rounded-xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Recent Students</h2>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary-600" />
              <a 
                href="/students" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
          <div className="space-y-4">
            {recentStudents.length > 0 ? (
              recentStudents.map((student, index) => (
                <div key={student._id || student.id || index} className="flex items-center p-3 bg-secondary-50 rounded-lg">
                  <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold">
                      {(student.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-900">{student.name || 'Unknown User'}</h3>
                    <p className="text-sm text-primary-600">{student.email || 'No email'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-primary-500">
                      {formatDate(student.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-primary-300 mx-auto mb-4" />
                <p className="text-primary-500">No students registered yet</p>
                <p className="text-sm text-primary-400">Students will appear here when they register</p>
              </div>
            )}
          </div>
          {recentStudents.length === 4 && (
            <div className="mt-4 pt-4 border-t border-primary-100">
              <a 
                href="/students" 
                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center"
              >
                View All Students <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-soft">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/assignments"
            className="flex items-center justify-center p-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors duration-200"
          >
            <Award className="h-5 w-5 mr-2" />
            Grade Assignments
          </a>
          <a
            href="/notices"
            className="flex items-center justify-center p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <Bell className="h-5 w-5 mr-2" />
            Manage Notices
          </a>
          <a
            href="/students"
            className="flex items-center justify-center p-4 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200"
          >
            <Users className="h-5 w-5 mr-2" />
            View Students
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;