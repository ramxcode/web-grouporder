import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

const StatCard = ({ label, value, color = '#6366f1' }) => (
  <div className="card" style={{ padding: '1rem', borderLeft: `3px solid ${color}` }}>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</p>
    <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
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

const actionColor = {
  CREATE: { bg: '#d1fae5', color: '#065f46' },
  UPDATE: { bg: '#dbeafe', color: '#1d4ed8' },
  DELETE: { bg: '#fee2e2', color: '#991b1b' },
  LOGIN: { bg: '#f3e8ff', color: '#7e22ce' },
  LOGOUT: { bg: '#f3f4f6', color: '#374151' },
};

export default function SellerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    api.get(`/owner/sellers/${id}`)
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout title="Detail Seller"><div className="loading-spinner" style={{ margin: '3rem auto' }} /></Layout>;
  if (!data) return (
    <Layout title="Detail Seller">
      <div className="empty-state">
        <h3>Seller tidak ditemukan</h3>
        <button className="btn btn-primary" onClick={() => navigate('/owner/sellers')}>Kembali</button>
      </div>
    </Layout>
  );

  const { seller, orders, buyers, payments, stocks, auditLogs, summary } = data;

  const tabs = [
    { key: 'orders', label: `Orders (${orders.length})` },
    { key: 'buyers', label: `Buyers (${buyers.length})` },
    { key: 'payments', label: `Payments (${payments.length})` },
    { key: 'stocks', label: `Stock (${stocks.length})` },
    { key: 'invoices', label: `Invoices (${orders.length})` },
    { key: 'activity', label: `Activity (${(auditLogs || []).length})` },
  ];

  return (
    <Layout title="Detail Seller" subtitle={`${seller.sellerId} — ${seller.user?.name}`}>
      <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate('/owner/sellers')}>
        ← Kembali ke Seller Management
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Seller Info */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.4rem', fontWeight: 700,
            }}>
              {seller.user?.name?.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seller.user?.name}</h3>
              <StatusBadge status={seller.status} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            {[
              ['Seller ID', seller.sellerId],
              ['Nama GO', seller.namaGO],
              ['Username', seller.user?.username ? `@${seller.user.username}` : '-'],
              ['Email', seller.user?.email],
              ['WhatsApp', seller.whatsapp || '-'],
              ['Terdaftar', formatDate(seller.createdAt)],
              ['Last Login', seller.user?.lastLogin ? formatDate(seller.user.lastLogin) : 'Belum pernah'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>{val}</span>
              </div>
            ))}
            {seller.notes && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                📝 {seller.notes}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '0.75rem', alignContent: 'start' }}>
          <StatCard label="Total Buyer" value={summary.totalBuyer} color="#6366f1" />
          <StatCard label="Total Order" value={summary.totalOrder} color="#3b82f6" />
          <StatCard label="Order Aktif" value={summary.totalOrderAktif} color="#f59e0b" />
          <StatCard label="Order Selesai" value={summary.totalOrderSelesai} color="#10b981" />
          <StatCard label="Total Payment" value={summary.totalPayment} color="#8b5cf6" />
          <StatCard label="Total Stok" value={summary.totalStock} color="#06b6d4" />
          <StatCard label="Total Penjualan" value={formatCurrency(summary.totalTransaksi)} color="#10b981" />
          <StatCard label="Total Profit" value={formatCurrency(summary.totalProfit)} color="#f59e0b" />
          <StatCard label="Total Pembayaran" value={formatCurrency(summary.totalPembayaran || 0)} color="#3b82f6" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', padding: '0.25rem 0' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <table className="table">
            <thead><tr><th>Order ID</th><th>Buyer</th><th>Item</th><th>Total</th><th>DP</th><th>Status Bayar</th><th>Status Barang</th><th>Tanggal</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>{o.orderId}</td>
                  <td>{o.buyer?.name}</td>
                  <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.item}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(o.hargaJual)}</td>
                  <td>{formatCurrency(o.dp)}</td>
                  <td><span className={`badge badge-${o.paymentStatus === 'Paid' ? 'success' : o.paymentStatus === 'DP' ? 'warning' : 'danger'}`}>{o.paymentStatus}</span></td>
                  <td><span className={`badge badge-${o.statusBarang === 'Done CO' ? 'success' : 'primary'}`}>{o.statusBarang}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada order</td></tr>}
            </tbody>
          </table>
        )}

        {/* Buyers Tab */}
        {activeTab === 'buyers' && (
          <table className="table">
            <thead><tr><th>Nama</th><th>WhatsApp</th><th>Email</th><th>Total Order</th><th>Sisa Tagihan</th><th>Status</th></tr></thead>
            <tbody>
              {buyers.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{b.whatsapp || '-'}</td>
                  <td>{b.email || '-'}</td>
                  <td>{b.totalOrders || 0}</td>
                  <td style={{ fontWeight: 600, color: b.sisaTagihan > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(b.sisaTagihan || 0)}</td>
                  <td><span className={`badge badge-${b.status === 'active' ? 'success' : 'secondary'}`}>{b.status}</span></td>
                </tr>
              ))}
              {buyers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada buyer</td></tr>}
            </tbody>
          </table>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <table className="table">
            <thead><tr><th>Order</th><th>Buyer</th><th>Nominal</th><th>Tipe</th><th>Metode</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.order?.orderId}</td>
                  <td>{p.buyer?.name}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                  <td>{p.type}</td>
                  <td>{p.method}</td>
                  <td><span className={`badge badge-${p.status === 'Confirmed' ? 'success' : 'warning'}`}>{p.status}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada payment</td></tr>}
            </tbody>
          </table>
        )}

        {/* Stocks Tab */}
        {activeTab === 'stocks' && (
          <table className="table">
            <thead><tr><th>Nama Barang</th><th>Variant</th><th>Buyer</th><th>Qty</th><th>Harga</th><th>Warehouse</th><th>Status</th></tr></thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }}>{s.namaBarang}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.variant || '-'}</td>
                  <td>{s.buyer?.name || '-'}</td>
                  <td>{s.quantity}</td>
                  <td>{formatCurrency(s.harga)}</td>
                  <td>{s.warehouse || '-'}</td>
                  <td><span className="badge badge-primary">{s.status}</span></td>
                </tr>
              ))}
              {stocks.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada stok</td></tr>}
            </tbody>
          </table>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <table className="table">
            <thead><tr><th>Invoice / Order ID</th><th>Buyer</th><th>Item</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right' }}>Dibayar</th><th style={{ textAlign: 'right' }}>Sisa</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>{o.orderId}</td>
                  <td>{o.buyer?.name || '-'}</td>
                  <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.item}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(o.hargaJual)}</td>
                  <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatCurrency(o.totalPembayaran || 0)}</td>
                  <td style={{ textAlign: 'right', color: (o.sisaTagihan || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{formatCurrency(o.sisaTagihan || 0)}</td>
                  <td><span className={`badge badge-${o.paymentStatus === 'Paid' ? 'success' : o.paymentStatus === 'DP' ? 'warning' : 'danger'}`}>{o.paymentStatus}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada invoice</td></tr>}
            </tbody>
          </table>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && (
          <table className="table">
            <thead><tr><th>Waktu</th><th>Action</th><th>Entity</th><th>Referensi</th><th>Deskripsi</th></tr></thead>
            <tbody>
              {(auditLogs || []).map(log => {
                const actionCfg = actionColor[log.action] || { bg: '#f3f4f6', color: '#374151' };
                return (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                    <td>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, color: actionCfg.color, background: actionCfg.bg }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.entity}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>{log.entityRef || '-'}</td>
                    <td style={{ fontSize: '0.83rem', maxWidth: '300px', color: 'var(--text-secondary)' }}>{log.description || '-'}</td>
                  </tr>
                );
              })}
              {(auditLogs || []).length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Belum ada aktivitas tercatat</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
