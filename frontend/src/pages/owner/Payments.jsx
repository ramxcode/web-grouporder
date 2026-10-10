import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function OwnerPayments() {
  const [payments, setPayments] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    api.get('/owner/sellers', { params: { limit: 100 } }).then(r => setSellers(r.data.data || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (sellerId) params.sellerId = sellerId;
      if (status) params.status = status;
      const r = await api.get('/owner/payments', { params });
      setPayments(r.data.data);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, sellerId, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Global Payments" subtitle="Semua transaksi pembayaran dari seluruh Seller">
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: '200px' }} value={sellerId} onChange={e => { setSellerId(e.target.value); setPage(1); }}>
            <option value="">Semua Seller</option>
            {sellers.map(s => <option key={s._id} value={s.user?._id}>{s.user?.name} ({s.sellerId})</option>)}
          </select>
          <select className="form-select" style={{ width: '160px' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
          <table className="table">
            <thead>
              <tr>
                <th>Order</th><th>Seller</th><th>Buyer</th>
                <th style={{ textAlign: 'right' }}>Nominal</th>
                <th>Tipe</th><th>Metode</th><th>Status</th><th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{p.order?.orderId || '-'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.seller?.name || '-'}</td>
                  <td style={{ fontWeight: 500 }}>{p.buyer?.name || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(p.amount)}</td>
                  <td>{p.type}</td>
                  <td>{p.method}</td>
                  <td><span className={`badge badge-${p.status === 'Confirmed' ? 'success' : p.status === 'Pending' ? 'warning' : 'danger'}`}>{p.status}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Tidak ada payment</td></tr>}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem' }}>
            <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>Hal {page} / {pagination.pages}</span>
            <button className="btn btn-sm btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
