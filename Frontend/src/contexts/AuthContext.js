import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Optionally verify token with backend
      verifyToken();
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.getMe();
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', email);
      const response = await authAPI.login({ email, password });
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        console.log('Extracted user:', user);
        console.log('Extracted token:', token);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return { success: true };
      } else {
        console.log('Response success was false');
        return { success: false, message: 'Inloggning misslyckades' };
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      const message = error.response?.data?.message || 'Inloggning misslyckades';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};