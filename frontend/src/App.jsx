import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Notices from './pages/Notices';
import LoadingSpinner from './components/LoadingSpinner';
import AdminAssignments from './pages/AdminAssignments';
import StudentAssignments from './pages/StudentAssignments';
import Students from './pages/ViewStudents';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-secondary-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/assignments" element={
            <ProtectedRoute>
              <StudentAssignments />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/assignments" element={
            <ProtectedRoute adminOnly>
              <AdminAssignments />
            </ProtectedRoute>
          } />
          
          <Route path="/notices" element={
            <ProtectedRoute>
              <Notices />
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute adminOnly>
              <Students />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;