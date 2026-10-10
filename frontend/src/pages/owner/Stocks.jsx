import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function OwnerStocks() {
  const [stocks, setStocks] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      if (sellerId) params.sellerId = sellerId;
      const r = await api.get('/owner/stocks', { params });
      setStocks(r.data.data);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, sellerId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Global Stock" subtitle="Semua stok barang dari seluruh Seller">
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <select className="form-select" style={{ width: '220px' }} value={sellerId} onChange={e => { setSellerId(e.target.value); setPage(1); }}>
          <option value="">Semua Seller</option>
          {sellers.map(s => <option key={s._id} value={s.user?._id}>{s.user?.name} ({s.sellerId})</option>)}
        </select>
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
          <table className="table">
            <thead>
              <tr><th>Nama Barang</th><th>Seller</th><th>Buyer</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Harga</th><th>Warehouse</th><th>Status</th><th>Tgl Masuk</th></tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }}>{s.namaBarang}{s.variant ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> — {s.variant}</span> : ''}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.seller?.name || '-'}</td>
                  <td>{s.buyer?.name || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{s.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(s.harga)}</td>
                  <td style={{ fontSize: '0.82rem' }}>{s.warehouse || '-'}</td>
                  <td><span className="badge badge-primary">{s.status}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.tanggalMasuk ? formatDate(s.tanggalMasuk) : '-'}</td>
                </tr>
              ))}
              {stocks.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Tidak ada stok</td></tr>}
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
