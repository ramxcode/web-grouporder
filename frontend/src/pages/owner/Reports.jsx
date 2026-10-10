import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

const StatCard = ({ label, value, sub, color = '#6366f1' }) => (
  <div className="card" style={{ padding: '1.1rem', borderLeft: `3px solid ${color}` }}>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</p>
    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
    {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</p>}
  </div>
);

const datePresets = [
  { label: 'Hari Ini', getValue: () => { const d = new Date().toISOString().split('T')[0]; return { startDate: d, endDate: d }; } },
  { label: 'Minggu Ini', getValue: () => { const d = new Date(); const s = new Date(d - d.getDay() * 86400000); return { startDate: s.toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }; } },
  { label: 'Bulan Ini', getValue: () => { const d = new Date(); return { startDate: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0], endDate: d.toISOString().split('T')[0] }; } },
  { label: 'Tahun Ini', getValue: () => { const d = new Date(); return { startDate: `${d.getFullYear()}-01-01`, endDate: d.toISOString().split('T')[0] }; } },
];

export default function OwnerReports() {
  const [data, setData] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    api.get('/owner/sellers', { params: { limit: 100 } }).then(r => setSellers(r.data.data || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (sellerId) params.sellerId = sellerId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const r = await api.get('/owner/reports', { params });
      setData(r.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [sellerId, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (preset) => {
    const { startDate: s, endDate: e } = preset.getValue();
    setStartDate(s);
    setEndDate(e);
  };

  const s = data?.summary || {};

  return (
    <Layout title="Reports" subtitle="Laporan transaksi seluruh Seller">
      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ width: '200px' }} value={sellerId} onChange={e => setSellerId(e.target.value)}>
            <option value="">Semua Seller</option>
            {sellers.map(s => <option key={s._id} value={s.user?._id}>{s.user?.name} ({s.sellerId})</option>)}
          </select>
          <input type="date" className="form-input" style={{ width: '160px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span style={{ color: 'var(--text-muted)' }}>s/d</span>
          <input type="date" className="form-input" style={{ width: '160px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {datePresets.map(p => (
              <button key={p.label} className="btn btn-sm btn-secondary" onClick={() => applyPreset(p)}>{p.label}</button>
            ))}
            <button className="btn btn-sm btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); setSellerId(''); }}>Reset</button>
          </div>
        </div>
      </div>

      {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            <StatCard label="Total Order" value={s.totalOrder || 0} color="#6366f1" />
            <StatCard label="Order Selesai" value={s.totalOrderSelesai || 0} color="#10b981" />
            <StatCard label="Order Aktif" value={s.totalOrderAktif || 0} color="#f59e0b" />
            <StatCard label="Nilai Transaksi" value={formatCurrency(s.totalTransaksi || 0)} color="#3b82f6" />
            <StatCard label="Total Profit" value={formatCurrency(s.totalProfit || 0)} color="#10b981" />
            <StatCard label="Total Payment" value={formatCurrency(s.totalPayment || 0)} color="#8b5cf6" />
          </div>

          {/* Seller Comparison */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Perbandingan Performa Seller
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th><th>Seller ID</th><th>Nama Seller</th><th>Nama GO</th>
                    <th style={{ textAlign: 'right' }}>Total Order</th>
                    <th style={{ textAlign: 'right' }}>Nilai Transaksi</th>
                    <th style={{ textAlign: 'right' }}>Total Profit</th>
                    <th style={{ textAlign: 'right' }}>Total Buyer</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.sellerComparison || []).map((sel, i) => (
                    <tr key={sel.sellerId} style={{ background: i === 0 ? 'rgba(99,102,241,0.04)' : '' }}>
                      <td>
                        <span style={{ fontSize: '1.1rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{sel.sellerId}</td>
                      <td style={{ fontWeight: 600 }}>{sel.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{sel.namaGO}</td>
                      <td style={{ textAlign: 'right' }}>{sel.totalOrder}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(sel.totalTransaksi)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(sel.totalProfit)}</td>
                      <td style={{ textAlign: 'right' }}>{sel.totalBuyer}</td>
                    </tr>
                  ))}
                  {(!data?.sellerComparison || data.sellerComparison.length === 0) && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Sellers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: '📦 Order Terbanyak', key: 'totalOrder' },
              { label: '💰 Transaksi Terbesar', key: 'totalTransaksi' },
              { label: '📈 Profit Terbesar', key: 'totalProfit' },
              { label: '👥 Buyer Terbanyak', key: 'totalBuyer' },
            ].map(({ label, key }) => {
              const top = [...(data?.sellerComparison || [])].sort((a, b) => b[key] - a[key]).slice(0, 3);
              return (
                <div key={key} className="card" style={{ padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem' }}>{label}</h4>
                  {top.map((sel, i) => (
                    <div key={sel.sellerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.82rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {sel.name}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {key.includes('Transaksi') || key.includes('Profit') ? formatCurrency(sel[key]) : sel[key]}
                      </span>
                    </div>
                  ))}
                  {top.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Tidak ada data</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
