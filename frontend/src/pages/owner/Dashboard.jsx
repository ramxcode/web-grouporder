import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

const StatCard = ({ label, value, sub, color = '#6366f1', icon }) => (
  <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</p>
        {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</p>}
      </div>
      {icon && <span style={{ fontSize: '2rem', opacity: 0.25 }}>{icon}</span>}
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    active: { label: 'Active', color: '#10b981', bg: '#d1fae5' },
    suspended: { label: 'Suspended', color: '#f59e0b', bg: '#fef3c7' },
    disabled: { label: 'Disabled', color: '#ef4444', bg: '#fee2e2' },
  };
  const cfg = map[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
};

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/dashboard').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const s = data?.summary || {};

  return (
    <Layout title="Owner Dashboard" subtitle="Ringkasan seluruh platform WEB REKAPAN GO">
      {loading ? (
        <div className="loading-spinner" style={{ margin: '3rem auto' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            <StatCard label="Total Seller" value={s.totalSeller || 0} sub={`${s.activeSellers || 0} aktif`} color="#6366f1" icon="🏪" />
            <StatCard label="Seller Nonaktif" value={s.suspendedSellers || 0} color="#f59e0b" icon="⏸️" />
            <StatCard label="Total Buyer" value={s.totalBuyer || 0} color="#10b981" icon="👥" />
            <StatCard label="Total Order" value={s.totalOrder || 0} sub={`${s.totalOrderAktif || 0} aktif`} color="#3b82f6" icon="📦" />
            <StatCard label="Order Selesai" value={s.totalOrderSelesai || 0} color="#10b981" icon="✅" />
            <StatCard label="Total Stok" value={s.totalStock || 0} color="#8b5cf6" icon="🗃️" />
            <StatCard label="Nilai Transaksi" value={formatCurrency(s.totalNilaiTransaksi || 0)} color="#06b6d4" icon="💰" />
            <StatCard label="Total Profit" value={formatCurrency(s.totalProfit || 0)} color="#10b981" icon="📈" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Status Distribution */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Distribusi Status Order</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(data?.statusCounts || {}).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', width: '110px', color: 'var(--text-secondary)' }}>{status}</span>
                    <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${s.totalOrder ? Math.round((count / s.totalOrder) * 100) : 0}%`,
                        height: '100%', background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '30px', textAlign: 'right', color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller Performance */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Performa Seller</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(data?.sellerPerformance || []).map((sp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{sp.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sp.namaGO} • {sp.totalOrder} order</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(sp.totalProfit)}</p>
                      <StatusBadge status={sp.status} />
                    </div>
                  </div>
                ))}
                {(!data?.sellerPerformance || data.sellerPerformance.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Belum ada data seller</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Sellers */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Seller Terbaru</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Seller</th><th>Nama GO</th><th>Email</th><th>Last Login</th><th>Status</th></tr></thead>
                <tbody>
                  {(data?.recentSellers || []).map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.user?.name}</td>
                      <td>{s.namaGO}</td>
                      <td>{s.user?.email}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.user?.lastLogin ? formatDate(s.user.lastLogin) : 'Belum pernah'}</td>
                      <td><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                  {(!data?.recentSellers || data.recentSellers.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada seller</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Order Terbaru</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Order ID</th><th>Seller</th><th>Buyer</th><th>Item</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {(data?.recentOrders || []).slice(0, 8).map(o => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.orderId}</td>
                      <td style={{ fontSize: '0.82rem' }}>{o.seller?.name || '-'}</td>
                      <td>{o.buyer?.name}</td>
                      <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.item}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(o.hargaJual)}</td>
                      <td><span className={`badge badge-${o.statusBarang === 'Done CO' ? 'success' : 'primary'}`}>{o.statusBarang}</span></td>
                    </tr>
                  ))}
                  {(!data?.recentOrders || data.recentOrders.length === 0) && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada order</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
