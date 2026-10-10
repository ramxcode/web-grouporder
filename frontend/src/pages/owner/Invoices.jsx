import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function OwnerInvoices() {
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    api.get('/owner/sellers', { params: { limit: 100 } }).then(r => setSellers(r.data.data || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (sellerId) params.sellerId = sellerId;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const r = await api.get('/owner/orders', { params });
      setOrders(r.data.data);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, sellerId, paymentStatus]);

  useEffect(() => { load(); }, [load]);

  const payBadge = (status) => {
    const map = {
      Paid: { color: '#10b981', bg: '#d1fae5' },
      DP: { color: '#f59e0b', bg: '#fef3c7' },
      Unpaid: { color: '#ef4444', bg: '#fee2e2' },
    };
    const cfg = map[status] || { color: '#6b7280', bg: '#f3f4f6' };
    return (
      <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>
        {status}
      </span>
    );
  };

  // Compute summary
  const totalTagihan = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
  const totalDibayar = orders.reduce((s, o) => s + (o.totalPembayaran || 0), 0);
  const totalSisa = orders.reduce((s, o) => s + (o.sisaTagihan || 0), 0);

  return (
    <Layout title="Global Invoices" subtitle="Seluruh invoice dari semua Seller">
      {/* Summary Cards */}
      {!loading && orders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Invoice (halaman)', value: orders.length, color: '#6366f1' },
            { label: 'Total Tagihan', value: formatCurrency(totalTagihan), color: '#3b82f6' },
            { label: 'Total Dibayar', value: formatCurrency(totalDibayar), color: '#10b981' },
            { label: 'Sisa Tagihan', value: formatCurrency(totalSisa), color: '#ef4444' },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: '1rem', borderLeft: `3px solid ${c.color}` }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{c.label}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ flex: '1', minWidth: '200px' }}
            placeholder="Cari order ID, item..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="form-select" style={{ width: '200px' }} value={sellerId} onChange={e => { setSellerId(e.target.value); setPage(1); }}>
            <option value="">Semua Seller</option>
            {sellers.map(s => <option key={s._id} value={s.user?._id}>{s.user?.name} ({s.sellerId})</option>)}
          </select>
          <select className="form-select" style={{ width: '150px' }} value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            {['Unpaid', 'DP', 'Paid'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setSellerId(''); setPaymentStatus(''); setPage(1); }}>
            Reset
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice / Order ID</th>
                  <th>Seller</th>
                  <th>Buyer</th>
                  <th>Item</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Dibayar</th>
                  <th style={{ textAlign: 'right' }}>Sisa</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>
                      {o.orderId}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{o.seller?.name || '-'}</td>
                    <td style={{ fontWeight: 500 }}>{o.buyer?.name || '-'}</td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.item}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(o.hargaJual)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatCurrency(o.totalPembayaran || 0)}</td>
                    <td style={{ textAlign: 'right', color: (o.sisaTagihan || 0) > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                      {formatCurrency(o.sisaTagihan || 0)}
                    </td>
                    <td>{payBadge(o.paymentStatus)}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    Tidak ada invoice ditemukan
                  </td></tr>
                )}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem' }}>
                <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Hal {page} / {pagination.pages} ({pagination.total} invoice)
                </span>
                <button className="btn btn-sm btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
