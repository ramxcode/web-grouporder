import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { StatusBadge, SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDate, formatDateShort, STATUS_ORDER, WAREHOUSES } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Icon from '../../components/Icon';

export default function Rekapan() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc');

  // Summary totals
  const [totals, setTotals] = useState({ totalHargaBeli: 0, totalHargaJual: 0, totalProfit: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15, search, sortOrder,
        ...(filterStatus && { statusBarang: filterStatus }),
        ...(filterWarehouse && { warehouse: filterWarehouse }),
        ...(filterBuyer && { buyerId: filterBuyer }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await api.get(`/orders?${params}`);
      if (res.data.success) {
        setOrders(res.data.data);
        setPagination(res.data.pagination);
        const t = res.data.data.reduce((acc, o) => ({
          totalHargaBeli: acc.totalHargaBeli + (o.hargaBeli || 0),
          totalHargaJual: acc.totalHargaJual + (o.hargaJual || 0),
          totalProfit: acc.totalProfit + (o.profit || 0),
        }), { totalHargaBeli: 0, totalHargaJual: 0, totalProfit: 0 });
        setTotals(t);
      }
    } catch { toast.error('Gagal memuat rekapan'); }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterWarehouse, filterBuyer, startDate, endDate, sortOrder]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    api.get('/buyers?limit=100').then(r => { if (r.data.success) setBuyers(r.data.data); });
  }, []);

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({ format, ...(filterBuyer && { buyerId: filterBuyer }), ...(filterStatus && { statusBarang: filterStatus }), ...(startDate && { startDate }), ...(endDate && { endDate }) });
      const res = await api.get(`/export/orders?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekapan-order.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Export ${format.toUpperCase()} berhasil`);
    } catch { toast.error('Export gagal'); }
  };

  return (
    <Layout title="Rekapan Order" subtitle="Rekap keuntungan dan laporan lengkap order">
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--warning)', '--stat-bg': 'var(--warning-light)' }}>
          <div className="stat-label">Total Harga Beli (Hal ini)</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(totals.totalHargaBeli)}</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--info)', '--stat-bg': 'var(--info-light)' }}>
          <div className="stat-label">Total Harga Jual (Hal ini)</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(totals.totalHargaJual)}</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--success)', '--stat-bg': 'var(--success-light)' }}>
          <div className="stat-label">Total Profit (Hal ini)</div>
          <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>{formatCurrency(totals.totalProfit)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Rekapan Order</div>
            {pagination && <div className="card-subtitle">{pagination.total} total order</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('xlsx')}>
              <Icon name="Download" size={14} /> Excel
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')}>
              <Icon name="Download" size={14} /> CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-input-wrap">
              <Icon name="Search" size={15} />
              <input type="text" className="search-input" placeholder="Cari order, item, resi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="filter-select" value={filterBuyer} onChange={e => { setFilterBuyer(e.target.value); setPage(1); }}>
              <option value="">Semua Buyer</option>
              {buyers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filterWarehouse} onChange={e => { setFilterWarehouse(e.target.value); setPage(1); }}>
              <option value="">Semua Warehouse</option>
              {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <input type="date" className="filter-select" value={startDate} onChange={e => setStartDate(e.target.value)} title="Dari tanggal" />
            <input type="date" className="filter-select" value={endDate} onChange={e => setEndDate(e.target.value)} title="Sampai tanggal" />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Nama Barang</th>
                <th>Website</th>
                <th>Tanggal</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Profit</th>
                <th>Nomor Resi</th>
                <th>Warehouse</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={8} cols={11} /> : orders.length === 0 ? (
                <tr><td colSpan={11}>
                  <EmptyState icon={<Icon name="TrendingUp" size={32} />} title="Tidak ada data" message="Coba ubah filter pencarian" />
                </td></tr>
              ) : orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>{o.orderId}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{o.buyer?.name}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.item}</div>
                    {o.quantity > 1 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>x{o.quantity}</div>}
                  </td>
                  <td style={{ fontSize: 12.5 }}>{o.website || '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateShort(o.createdAt)}</td>
                  <td style={{ fontSize: 13 }}>{formatCurrency(o.hargaBeli)}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(o.hargaJual)}</td>
                  <td style={{ fontWeight: 700, color: (o.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatCurrency(o.profit)}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{o.nomorResi || '-'}</td>
                  <td>{o.warehouse ? <span className="badge badge-info">{o.warehouse}</span> : '-'}</td>
                  <td><StatusBadge status={o.statusBarang} /></td>
                </tr>
              ))}
            </tbody>
          </table>
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
