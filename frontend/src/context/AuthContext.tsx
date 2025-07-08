import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  userId: any;
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const p = payload.user ? payload.user : payload;
        setUser({
          id: p.id,
          name: p.name || 'User',
          email: p.email || '',
          role: p.role
        });
      } catch (error) {
        console.error('Invalid token');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      });
      console.log(response.data);
      const { user, token } = response.data;
      console.log("user.name", user.name);
      console.log("token", token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);
      localStorage.setItem('user._id', user._id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/admin-login', {
        email,
        password
      });
      
      const { user, token } = response.data;
      if (user.role !== 'admin') {
        throw new Error('Unauthorized: Not an admin account');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Admin login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        name,
        email,
        password
      });
      
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;