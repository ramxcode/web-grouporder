import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

// Apply website settings to DOM: title + CSS variables
const applyWebsiteSettingsToDOM = (s) => {
  if (!s) return;
  // Update browser tab title
  if (s.siteName) document.title = s.siteName;
  // Update favicon
  if (s.favicon) {
    let link = document.querySelector("link[rel='icon']") || document.querySelector("link[rel='shortcut icon']");
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = s.favicon;
  }
  // Apply CSS custom properties
  const root = document.documentElement;
  if (s.primaryColor) {
    root.style.setProperty('--primary', s.primaryColor);
    root.style.setProperty('--primary-dark', s.primaryColor);
    // Compute RGB for rgba() usage
    const hex = s.primaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r)) root.style.setProperty('--primary-rgb', `${r},${g},${b}`);
  }
  if (s.secondaryColor) root.style.setProperty('--secondary', s.secondaryColor);
  if (s.accentColor) root.style.setProperty('--accent', s.accentColor);
  if (s.sidebarColor) root.style.setProperty('--sidebar-bg', s.sidebarColor);
  if (s.backgroundColor) root.style.setProperty('--bg', s.backgroundColor);
  if (s.borderRadius) root.style.setProperty('--radius', s.borderRadius);
};

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
      if (data.success) {
        setWebsiteSettings(data.data);
        applyWebsiteSettingsToDOM(data.data);
      }
    } catch { /* fail silently */ }
  }, []);

  // Expose refresh so WebsiteSettings page can trigger re-apply after save
  const refreshSettings = useCallback(() => loadSettings(), [loadSettings]);

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
    refreshSettings,
    applyWebsiteSettingsToDOM,
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

