import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [websiteSettings, setWebsiteSettings] = useState(null);

  // Load website settings for branding (public endpoint)
  const loadSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/owner/website-settings');
      if (data.success) setWebsiteSettings(data.data);
    } catch { /* fail silently */ }
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.user);
        setBuyerProfile(data.buyerProfile);
        setIsAuthenticated(true);
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadSettings();
  }, [loadUser, loadSettings]);

  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setBuyerProfile(data.buyerProfile);
      setIsAuthenticated(true);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setBuyerProfile(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    buyerProfile,
    loading,
    isAuthenticated,
    login,
    logout,
    loadUser,
    websiteSettings,
    isSuperAdmin: user?.role === 'super_admin',
    isSeller: user?.role === 'seller',
    isBuyer: user?.role === 'buyer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
