import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Bell, 
  TrendingUp, 
  Award,
  Clock,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

interface Stats {
  totalStudents: number;
  totalAssignments: number;
  pendingGrading: number;
  totalNotices: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Submission {
  _id: string;
  studentId: string;
  studentName: string;
  submissionFile: string;
  submittedAt: string;
  marks?: number;
  feedback?: string;
  gradedAt?: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  submissions: Submission[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalAssignments: 0,
    pendingGrading: 0,
    totalNotices: 0
  });
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [recentStudents, setRecentStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [studentsRes, assignmentsRes, noticesRes] = await Promise.all([
        axios.get<User[]>('http://localhost:3001/api/users/students'),
        axios.get<Assignment[]>('http://localhost:3001/api/assignments'),
        axios.get('http://localhost:3001/api/notices')
      ]);

      const students = studentsRes.data;
      const assignments = assignmentsRes.data || [];
      const notices = noticesRes.data || [];

      // Calculate stats
      const pendingGrading = assignments.filter(a => !a.submissions?.some(s => s.marks !== undefined)).length;

      setStats({
        totalStudents: students.length,
        totalAssignments: assignments.length,
        pendingGrading: pendingGrading,
        totalNotices: notices.length
      });

      // Get recent assignments with submissions
      const recentAssignmentsData = assignments
        .filter(a => a.submissions?.length > 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setRecentAssignments(recentAssignmentsData);

      // Get recent students
      const recentStudentsData = students
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setRecentStudents(recentStudentsData);
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
  }: { 
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    subtitle: string;
  }) => (
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <FileText className="h-5 w-5 text-primary-600" />
          </div>
          <div className="space-y-4">
            {recentAssignments.length > 0 ? (
              recentAssignments.map((assignment) => (
                <div key={assignment._id} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-900">{assignment.title}</h3>
                    <p className="text-sm text-primary-600">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {assignment.submissions.some(s => s.marks !== undefined) ? (
                      <span className="text-sm font-semibold text-green-600">
                        Graded
                      </span>
                    ) : (
                      <span className="text-sm text-orange-600 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-primary-500 text-center py-4">No assignments yet</p>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white p-6 rounded-xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary-900">Recent Students</h2>
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <div className="space-y-4">
            {recentStudents.length > 0 ? (
              recentStudents.map((student) => (
                <div key={student._id} className="flex items-center p-3 bg-secondary-50 rounded-lg">
                  <div className="w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-900">{student.name}</h3>
                    <p className="text-sm text-primary-600">{student.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-primary-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-primary-500 text-center py-4">No students yet</p>
            )}
          </div>
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