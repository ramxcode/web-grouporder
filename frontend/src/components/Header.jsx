import { useState, useEffect } from 'react';
import { Menu, Bell, Moon, Sun, ChevronDown, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Header({ onMenuToggle, title, subtitle }) {
  const { user, logout, isSeller, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications?limit=1');
        if (data.success) setUnread(data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const notifPath = isSuperAdmin
    ? '/owner/notifications'
    : isSeller ? '/seller/notifikasi' : '/buyer/notifikasi';
  const profilePath = isSuperAdmin ? '/owner/profile' : null;

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle} style={{ display: 'flex' }}>
          <Menu size={20} />
        </button>
        <div>
          {title && <div className="page-title">{title}</div>}
          {subtitle && <div className="page-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="header-right">
        <button className="header-btn" onClick={toggleTheme} title="Toggle theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="header-btn"
          onClick={() => navigate(notifPath)}
          title="Notifikasi"
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
          )}
        </button>

        {/* User dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-btn"
            onClick={() => setShowUserMenu(v => !v)}
            style={{
              width: 'auto', padding: '0 10px', gap: 6,
              display: 'flex', alignItems: 'center',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: isSuperAdmin
                ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {getInitials(user?.name)}
            </div>
            <span style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
              maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name}
            </span>
            {isSuperAdmin && (
              <Shield size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
            )}
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showUserMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                onClick={() => setShowUserMenu(false)}
              />
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                zIndex: 99, minWidth: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {user?.email || user?.whatsapp}
                  </div>
                  {isSuperAdmin && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10.5, color: '#a78bfa', fontWeight: 700, marginTop: 4,
                      background: 'rgba(167,139,250,0.12)', padding: '2px 8px', borderRadius: 999,
                    }}>
                      <Shield size={9} /> Super Admin / Owner
                    </div>
                  )}
                </div>
                {profilePath && (
                  <button
                    onClick={() => { navigate(profilePath); setShowUserMenu(false); }}
                    style={{
                      width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center',
                      gap: 8, fontSize: 13, color: 'var(--text)', fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <User size={14} />
                    Profile
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center',
                    gap: 8, fontSize: 13, color: 'var(--danger)', fontWeight: 500,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
