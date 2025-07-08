import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  Bell, 
  Upload, 
  TrendingUp, 
  Calendar,
  BookOpen,
  Award,
  Clock
} from 'lucide-react';
import axios from 'axios';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    gradedAssignments: 0,
    averageGrade: 0,
    pendingAssignments: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [assignmentsRes, noticesRes] = await Promise.all([
        axios.get('http://localhost:3001/api/assignments'),
        axios.get('http://localhost:3001/api/notices')
      ]);

      const assignments = assignmentsRes.data;
      const notices = noticesRes.data;

      const gradedAssignments = assignments.filter(a => a.grade !== null);
      const averageGrade = gradedAssignments.length > 0 
        ? gradedAssignments.reduce((sum, a) => sum + a.grade, 0) / gradedAssignments.length
        : 0;

      setStats({
        totalAssignments: assignments.length,
        gradedAssignments: gradedAssignments.length,
        averageGrade: averageGrade,
        pendingAssignments: assignments.filter(a => a.grade === null).length
      });

      setRecentAssignments(assignments.slice(0, 3));
      setRecentNotices(notices.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary-600">{title}</p>
          <p className="text-2xl font-bold text-primary-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-primary-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

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
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-200">Here's your academic overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assignments"
          value={stats.totalAssignments}
          icon={FileText}
          color="bg-accent-600"
          subtitle="Submitted"
        />
        <StatCard
          title="Graded Assignments"
          value={stats.gradedAssignments}
          icon={Award}
          color="bg-green-600"
          subtitle="Completed"
        />
        <StatCard
          title="Average Grade"
          value={stats.averageGrade.toFixed(1)}
          icon={TrendingUp}
          color="bg-blue-600"
          subtitle="Overall performance"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingAssignments}
          icon={Clock}
          color="bg-orange-600"
          subtitle="Awaiting grades"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <div className="bg-white p-6 rounded-xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Recent Assignments</h2>
            <FileText className="h-5 w-5 text-primary-600" />
          </div>
          <div className="space-y-4">
            {recentAssignments.length > 0 ? (
              recentAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-900">{assignment.title}</h3>
                    <p className="text-sm text-primary-600">
                      Submitted {new Date(assignment.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {assignment.grade !== null ? (
                      <span className="text-sm font-semibold text-green-600">
                        {assignment.grade}/100
                      </span>
                    ) : (
                      <span className="text-sm text-orange-600">Pending</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-primary-500 text-center py-4">No assignments yet</p>
            )}
          </div>
        </div>

        {/* Recent Notices */}
        <div className="bg-white p-6 rounded-xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Recent Notices</h2>
            <Bell className="h-5 w-5 text-primary-600" />
          </div>
          <div className="space-y-4">
            {recentNotices.length > 0 ? (
              recentNotices.map((notice) => (
                <div key={notice.id} className="p-3 bg-secondary-50 rounded-lg">
                  <h3 className="font-medium text-primary-900">{notice.title}</h3>
                  <p className="text-sm text-primary-600 mt-1 line-clamp-2">
                    {notice.content}
                  </p>
                  <p className="text-xs text-primary-500 mt-2">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-primary-500 text-center py-4">No notices yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-soft">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/assignments"
            className="flex items-center justify-center p-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors duration-200"
          >
            <Upload className="h-5 w-5 mr-2" />
            Submit Assignment
          </a>
          <a
            href="/notices"
            className="flex items-center justify-center p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
          >
            <Bell className="h-5 w-5 mr-2" />
            View Notices
          </a>
          <a
            href="/profile"
            className="flex items-center justify-center p-4 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Edit Profile
          </a>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;