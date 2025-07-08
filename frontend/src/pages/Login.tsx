import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Mail, Lock, AlertCircle, UserCog, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { login, adminLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminMode) {
        await adminLogin(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      console.error('Login error', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const switchToAdmin = () => {
    setIsAdminMode(true);
    setEmail('admin@campus.edu');
    setPassword('admin123');
  };

  const switchToStudent = () => {
    setIsAdminMode(false);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-900 p-3 rounded-full">
              <BookOpen className="h-8 w-8 text-secondary-300" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-primary-900">Welcome back</h2>
          <p className="mt-2 text-primary-600">Sign in to your CampusConnect account</p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={switchToStudent}
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
              !isAdminMode
                ? 'bg-primary-800 text-white'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            Student
          </button>
          <button
            type="button"
            onClick={switchToAdmin}
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
              isAdminMode
                ? 'bg-primary-800 text-white'
                : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
            }`}
          >
            <UserCog className="h-4 w-4 mr-2" />
            Admin
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all duration-200"
                  placeholder={isAdminMode ? "admin@campusconnect.com" : "Enter your email"}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition-all duration-200"
                  placeholder={isAdminMode ? "••••••" : "Enter your password"}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-800 text-white py-3 px-4 rounded-lg hover:bg-primary-900 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Signing in...' : `Sign in as ${isAdminMode ? 'Admin' : 'Student'}`}
            </button>

            {!isAdminMode && (
              <div className="text-center">
                <p className="text-primary-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-accent-600 hover:text-accent-700 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            )}

            {!isAdminMode && (
              <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-600">
                  Register as a student to get started
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;