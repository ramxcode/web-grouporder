import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [statusBarang, setStatusBarang] = useState('');
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
      if (statusBarang) params.statusBarang = statusBarang;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const r = await api.get('/owner/orders', { params });
      setOrders(r.data.data);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, sellerId, statusBarang, paymentStatus]);

  useEffect(() => { load(); }, [load]);

  const STATUSES = ['Ordered', 'WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Arrived INA', 'Arrived Admin', 'Done CO'];

  return (
    <Layout title="Global Orders" subtitle="Semua order dari seluruh Seller">
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: '1', minWidth: '200px' }} placeholder="Cari order ID, item..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="form-select" style={{ width: '180px' }} value={sellerId} onChange={e => { setSellerId(e.target.value); setPage(1); }}>
            <option value="">Semua Seller</option>
            {sellers.map(s => <option key={s._id} value={s.user?._id}>{s.user?.name} ({s.sellerId})</option>)}
          </select>
          <select className="form-select" style={{ width: '160px' }} value={statusBarang} onChange={e => { setStatusBarang(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select" style={{ width: '140px' }} value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPage(1); }}>
            <option value="">Semua Payment</option>
            {['Unpaid', 'DP', 'Paid'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th><th>Seller</th><th>Buyer</th><th>Item</th>
                <th style={{ textAlign: 'right' }}>Total</th><th>Payment</th><th>Warehouse</th><th>Status</th><th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>{o.orderId}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{o.seller?.name || '-'}</td>
                  <td style={{ fontWeight: 500 }}>{o.buyer?.name}</td>
                  <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.item}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(o.hargaJual)}</td>
                  <td><span className={`badge badge-${o.paymentStatus === 'Paid' ? 'success' : o.paymentStatus === 'DP' ? 'warning' : 'danger'}`}>{o.paymentStatus}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{o.warehouse || '-'}</td>
                  <td><span className={`badge badge-${o.statusBarang === 'Done CO' ? 'success' : 'primary'}`}>{o.statusBarang}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Tidak ada order ditemukan</td></tr>}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem' }}>
            <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hal {page} / {pagination.pages}</span>
            <button className="btn btn-sm btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
