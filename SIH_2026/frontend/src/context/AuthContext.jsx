import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
        const storedUser = storage.get(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          
          // Optionally verify token with backend
          try {
            const currentUser = await authAPI.getCurrentUser();
            setUser(currentUser);
            storage.set(STORAGE_KEYS.USER, currentUser);
          } catch (err) {
            // Token might be expired, clear auth
            console.error('Token verification failed:', err);
            logout();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      
      setToken(response.access_token);
      setUser(response.user);
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
      storage.set(STORAGE_KEYS.USER, response.user);
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName) => {
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.register(email, password, fullName);
      
      // After registration, automatically log in
      return await login(email, password);
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setToken(null);
      setUser(null);
      storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      storage.remove(STORAGE_KEYS.USER);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    storage.set(STORAGE_KEYS.USER, userData);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
