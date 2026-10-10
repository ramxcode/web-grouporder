import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function OwnerBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sellerId, setSellerId] = useState('');
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
      const r = await api.get('/owner/buyers', { params });
      setBuyers(r.data.data);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, sellerId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Global Buyers" subtitle="Semua buyer dari seluruh Seller">
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: '1', minWidth: '200px' }} placeholder="Cari nama, email, WA..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="form-select" style={{ width: '200px' }} value={sellerId} onChange={e => { setSellerId(e.target.value); setPage(1); }}>
            <option value="">Semua Seller</option>
            {sellers.map(s => <option key={s._id} value={s.user?._id}>{s.user?.name} ({s.sellerId})</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
          <table className="table">
            <thead>
              <tr>
                <th>Nama Buyer</th><th>Seller</th><th>WhatsApp</th><th>Email</th>
                <th style={{ textAlign: 'right' }}>Total Order</th>
                <th style={{ textAlign: 'right' }}>Total Tagihan</th>
                <th style={{ textAlign: 'right' }}>Sisa Tagihan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{b.seller?.name || '-'}</td>
                  <td>{b.whatsapp || '-'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{b.email || '-'}</td>
                  <td style={{ textAlign: 'right' }}>{b.totalOrders || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(b.totalTagihan || 0)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: (b.sisaTagihan || 0) > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(b.sisaTagihan || 0)}</td>
                  <td><span className={`badge badge-${b.status === 'active' ? 'success' : 'secondary'}`}>{b.status}</span></td>
                </tr>
              ))}
              {buyers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Tidak ada buyer ditemukan</td></tr>}
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
