import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';
import { Bell, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  order_new: { bg: '#dbeafe', color: '#1e40af', icon: '📦' },
  order_status: { bg: '#f0fdf4', color: '#15803d', icon: '🔄' },
  order_arrived_wh: { bg: '#fef3c7', color: '#92400e', icon: '🏭' },
  order_arrived_ina: { bg: '#d1fae5', color: '#065f46', icon: '✈️' },
  order_arrived_admin: { bg: '#ecfdf5', color: '#047857', icon: '📬' },
  order_done: { bg: '#f0fdf4', color: '#15803d', icon: '✅' },
  payment_new: { bg: '#fef3c7', color: '#92400e', icon: '💰' },
  payment_confirmed: { bg: '#d1fae5', color: '#065f46', icon: '✓' },
  payment_paid: { bg: '#dcfce7', color: '#15803d', icon: '🎉' },
  general: { bg: 'var(--bg)', color: 'var(--text)', icon: '🔔' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?page=${page}&limit=20&unreadOnly=${unreadOnly}`);
      if (res.data.success) {
        setNotifications(res.data.data);
        setPagination(res.data.pagination);
        setUnreadCount(res.data.unreadCount);
      }
    } catch { toast.error('Gagal memuat notifikasi'); }
    finally { setLoading(false); }
  }, [page, unreadOnly]);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi ditandai dibaca');
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notifikasi dihapus');
    } catch {}
  };

  return (
    <Layout title="Notifikasi" subtitle={`${unreadCount} notifikasi belum dibaca`}>
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="card-title">Notifikasi</div>
            {unreadCount > 0 && (
              <span className="badge badge-danger">{unreadCount} baru</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="checkbox-wrap">
              <input type="checkbox" checked={unreadOnly} onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }} />
              <span style={{ fontSize: 13 }}>Belum dibaca saja</span>
            </label>
            {unreadCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                <Check size={14} /> Tandai Semua Dibaca
              </button>
            )}
          </div>
        </div>

        <div>
          {loading ? (
            <div style={{ padding: 24 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={<Bell size={32} />} title="Tidak ada notifikasi" message={unreadOnly ? 'Semua notifikasi sudah dibaca' : 'Belum ada notifikasi'} />
          ) : (
            notifications.map(n => {
              const style = TYPE_COLORS[n.type] || TYPE_COLORS.general;
              return (
                <div
                  key={n._id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 24px',
                    borderBottom: '1px solid var(--border-light)',
                    background: n.isRead ? 'transparent' : 'var(--primary-bg)',
                    transition: 'background 0.2s',
                    cursor: !n.isRead ? 'pointer' : 'default',
                  }}
                  onClick={() => !n.isRead && markRead(n._id)}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: style.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20,
                  }}>
                    {style.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text)' }}>{n.title}</span>
                      {!n.isRead && <span className="badge badge-primary" style={{ fontSize: 10 }}>Baru</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{n.message}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDate(n.createdAt, true)}</div>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                    onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                    title="Hapus"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {pagination && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </Layout>
  );
}
