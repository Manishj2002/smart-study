import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = authService.getUser();
    const token = authService.getToken();
    
    if (storedUser && token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};