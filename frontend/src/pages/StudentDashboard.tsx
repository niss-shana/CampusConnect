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

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [assignmentsRes, noticesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/assignments`, { headers }),
          axios.get(`${API_BASE_URL}/notices`, { headers })
      ]);

      const assignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
      const notices = Array.isArray(noticesRes.data) ? noticesRes.data : [];

      console.log('Fetched assignments:', assignments);
      console.log('Current user:', user);

      // More flexible filtering - try different possible field names
      const userAssignments = assignments.filter((a) => {
        if (!a || typeof a !== 'object') return false;
        // Check multiple possible user identification fields
        return a.studentId === user?.id || 
               a.userId === user?.id || 
               a.student === user?.id ||
               a.submittedBy === user?.id ||
               a.createdBy === user?.id ||
               !a.studentId; // If no studentId field, show all assignments
      });

      console.log('Filtered user assignments:', userAssignments);
      
      // Calculate graded assignments (assignments with marks/grades)
      const gradedAssignments = userAssignments.filter((a) => {
        if (!a || typeof a !== 'object') return false;
        
        // Check if assignment has submissions with marks for current user
        const userSubmission = a.submissions?.find((sub) => sub.studentId === user?.id);
        const hasGrade = userSubmission && 
                        userSubmission.marks !== null && 
                        userSubmission.marks !== undefined && 
                        userSubmission.marks !== '';
        
        console.log(`Assignment ${a.title || 'Unknown'}: userSubmission =`, userSubmission, `, hasGrade = ${hasGrade}`);
        return hasGrade;
      });
      
      console.log('Graded assignments:', gradedAssignments);
      
      // Calculate average grade properly from submissions
      const averageGrade = gradedAssignments.length > 0 
        ? gradedAssignments.reduce((sum, a) => {
            const userSubmission = a.submissions?.find((sub) => sub.studentId === user?.id);
            return sum + Number(userSubmission?.marks || 0);
          }, 0) / gradedAssignments.length
        : 0;

      // Calculate pending assignments (assignments that have submissions but no grades)
      const pendingAssignments = userAssignments.filter((a) => {
        if (!a || typeof a !== 'object') return false;
        
        const userSubmission = a.submissions?.find((sub) => sub.studentId === user?.id);
        const hasSubmission = userSubmission && userSubmission.submissionFile;
        const notGraded = !userSubmission || 
                         userSubmission.marks === null || 
                         userSubmission.marks === undefined || 
                         userSubmission.marks === '';
        
        console.log(`Assignment ${a.title || 'Unknown'}: hasSubmission = ${hasSubmission}, notGraded = ${notGraded}`);
        return hasSubmission && notGraded;
      });

      console.log('Pending assignments:', pendingAssignments);

      setStats({
        totalAssignments: userAssignments.length,
        gradedAssignments: gradedAssignments.length,
        averageGrade: Number(averageGrade.toFixed(1)),
        pendingAssignments: pendingAssignments.length
      });

      // Sort assignments by submission date and take recent 3
      // Try multiple date field names
      const sortedAssignments = userAssignments
        .filter((a) => a && typeof a === 'object')
        .sort((a, b) => {
          const dateA = new Date(a.submittedAt || a.createdAt || a.dateSubmitted || 0);
          const dateB = new Date(b.submittedAt || b.createdAt || b.dateSubmitted || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 3);

      console.log('Sorted assignments for display:', sortedAssignments);

      // Sort notices by created date and take recent 3
      const sortedNotices = notices
        .filter((n) => n && typeof n === 'object')
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.dateCreated || 0);
          const dateB = new Date(b.createdAt || b.dateCreated || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 3);

      setRecentAssignments(sortedAssignments);
      setRecentNotices(sortedNotices);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values in case of error
      setStats({
        totalAssignments: 0,
        gradedAssignments: 0,
        averageGrade: 0,
        pendingAssignments: 0
      });
      setRecentAssignments([]);
      setRecentNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
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
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Student'}!</h1>
        <p className="text-primary-200">Here's your academic overview</p>
      </div>

      {/* Stats Grid - Reduced size */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          value={stats.averageGrade > 0 ? `${stats.averageGrade}%` : 'N/A'}
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
              recentAssignments.map((assignment, index) => (
                <div key={assignment?._id || assignment?.id || index} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-900">{assignment?.title || 'Unknown Assignment'}</h3>
                    <p className="text-sm text-primary-600">
                      {(() => {
                        const userSubmission = assignment?.submissions?.find((sub) => sub?.studentId === user?.id);
                        if (userSubmission?.gradedAt) {
                          return `Graded ${new Date(userSubmission.gradedAt).toLocaleDateString()}`;
                        } else if (userSubmission?.submissionFile) {
                          return `Submitted ${assignment?.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'Date unknown'}`;
                        } else {
                          return `Created ${assignment?.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'Date unknown'}`;
                        }
                      })()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    {(() => {
                      const userSubmission = assignment?.submissions?.find((sub) => sub?.studentId === user?.id);
                      if (userSubmission && userSubmission.marks !== null && userSubmission.marks !== undefined && userSubmission.marks !== '') {
                        return (
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-bold text-green-600">
                              {userSubmission.marks}/{assignment?.totalMarks || 100}
                            </span>
                            <span className="text-xs text-green-500">
                              {Math.round((userSubmission.marks / (assignment?.totalMarks || 100)) * 100)}% - Graded
                            </span>
                          </div>
                        );
                      } else if (userSubmission && userSubmission.submissionFile) {
                        return (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-orange-600">Pending</span>
                            <span className="text-xs text-orange-500">Under review</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-gray-600">Not Submitted</span>
                            <span className="text-xs text-gray-500">No submission</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-primary-300 mx-auto mb-4" />
                <p className="text-primary-500">No assignments submitted yet</p>
                <p className="text-sm text-primary-400">Submit your first assignment to see it here</p>
              </div>
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
              recentNotices.map((notice, index) => (
                <div key={notice?._id || notice?.id || index} className="p-3 bg-secondary-50 rounded-lg">
                  <h3 className="font-medium text-primary-900">{notice?.title || 'Unknown Notice'}</h3>
                  <p className="text-sm text-primary-600 mt-1 line-clamp-2">
                    {notice?.content || 'No content available'}
                  </p>
                  <p className="text-xs text-primary-500 mt-2">
                    {notice && typeof notice === 'object' && notice.createdAt
                      ? new Date(String(notice.createdAt)).toLocaleDateString()
                      : 'Date unknown'}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-primary-300 mx-auto mb-4" />
                <p className="text-primary-500">No notices yet</p>
                <p className="text-sm text-primary-400">Check back later for updates</p>
              </div>
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