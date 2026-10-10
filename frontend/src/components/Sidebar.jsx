import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, ShoppingBag, FileText, CreditCard, Package,
  Users, BarChart3, Bell, Settings, LogOut, Moon, Sun, Package2,
  Store, Globe, Wrench, Shield, ChevronDown, UserCog, Receipt,
} from 'lucide-react';

const sellerMenu = [
  { section: 'MAIN' },
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'ORDER' },
  { to: '/seller/status-order', icon: ShoppingBag, label: 'Status Order' },
  { to: '/seller/data-order', icon: FileText, label: 'Data Order' },
  { to: '/seller/rekapan', icon: BarChart3, label: 'Rekapan Order' },
  { section: 'KEUANGAN' },
  { to: '/seller/payment', icon: CreditCard, label: 'Payment' },
  { section: 'INVENTORI' },
  { to: '/seller/stok', icon: Package, label: 'Stok Barang' },
  { section: 'MASTER DATA' },
  { to: '/seller/buyers', icon: Users, label: 'Buyer' },
  { section: 'SISTEM' },
  { to: '/seller/notifikasi', icon: Bell, label: 'Notifikasi', notif: true },
  { to: '/seller/audit-log', icon: FileText, label: 'Activity Log' },
  { to: '/seller/settings', icon: Settings, label: 'Pengaturan' },
];

const buyerMenu = [
  { to: '/buyer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/buyer/status-order', icon: ShoppingBag, label: 'Status Order' },
  { to: '/buyer/payment', icon: CreditCard, label: 'Payment' },
  { to: '/buyer/stok', icon: Package2, label: 'Stok Saya' },
  { to: '/buyer/notifikasi', icon: Bell, label: 'Notifikasi', notif: true },
];

const ownerMenu = [
  { section: 'OVERVIEW' },
  { to: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'MANAJEMEN' },
  { to: '/owner/sellers', icon: Store, label: 'Seller Management' },
  { to: '/owner/buyers', icon: Users, label: 'Global Buyers' },
  { to: '/owner/orders', icon: ShoppingBag, label: 'Global Orders' },
  { to: '/owner/payments', icon: CreditCard, label: 'Global Payments' },
  { to: '/owner/invoices', icon: Receipt, label: 'Global Invoices' },
  { to: '/owner/stocks', icon: Package, label: 'Global Stock' },
  { section: 'LAPORAN' },
  { to: '/owner/reports', icon: BarChart3, label: 'Reports' },
  { section: 'SISTEM' },
  { to: '/owner/notifications', icon: Bell, label: 'Notifikasi', notif: true },
  { to: '/owner/audit-log', icon: FileText, label: 'Audit Log' },
  { section: 'KONFIGURASI' },
  { to: '/owner/website-settings', icon: Globe, label: 'Website Settings' },
  { to: '/owner/admin-management', icon: UserCog, label: 'Admin Management' },
  { to: '/owner/profile', icon: Settings, label: 'Profile' },
];

export default function Sidebar({ isOpen, onClose, unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const role = user?.role;
  const isSuperAdmin = role === 'super_admin';
  const isSeller = role === 'seller';
  const menu = isSuperAdmin ? ownerMenu : isSeller ? sellerMenu : buyerMenu;

  const roleLabel = isSuperAdmin ? 'Super Admin / Owner' : isSeller ? 'Seller / Admin' : 'Buyer';
  const roleBadgeColor = isSuperAdmin ? '#7c3aed' : isSeller ? 'var(--primary)' : '#10b981';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-icon">GO</div>
            <div>
              <h1>WEB REKAPAN GO</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {isSuperAdmin && <Shield size={11} style={{ color: '#a78bfa' }} />}
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Super Admin badge */}
        {isSuperAdmin && (
          <div style={{ padding: '0 1rem 0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(139,92,246,0.2))',
              border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              fontSize: '0.72rem',
              color: '#c4b5fd',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <Shield size={11} />
              AKSES PENUH — SUPER ADMIN
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menu.map((item, i) => {
            if (item.section) {
              return <div key={i} className="sidebar-section">{item.section}</div>;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.notif && unreadCount > 0 && (
                  <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ flex: 1, justifyContent: 'center', color: 'var(--sidebar-text)', fontSize: 12 }}
              onClick={toggleTheme}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: '#ef4444' }}
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={14} />
              <span style={{ fontSize: 12 }}>Keluar</span>
            </button>
          </div>
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-details">
              <h4>{user?.name}</h4>
              <p style={{ color: isSuperAdmin ? '#c4b5fd' : undefined }}>{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
