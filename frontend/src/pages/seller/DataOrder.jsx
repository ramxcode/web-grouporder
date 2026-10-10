// DataOrder page - comprehensive order database
import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { StatusBadge, PaymentBadge, ConfirmDialog, SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDateShort, STATUS_ORDER, WAREHOUSES, PAYMENT_STATUSES } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, Eye, Download, Database } from 'lucide-react';
import OrderModal from './components/OrderModal';
import OrderDetail from './components/OrderDetail';

export default function DataOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [buyers, setBuyers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 20, search, sortOrder,
        ...(filterBuyer && { buyerId: filterBuyer }),
        ...(filterPayment && { paymentStatus: filterPayment }),
        ...(filterStatus && { statusBarang: filterStatus }),
        ...(filterWarehouse && { warehouse: filterWarehouse }),
      });
      const res = await api.get(`/orders?${params}`);
      if (res.data.success) { setOrders(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat data order'); }
    finally { setLoading(false); }
  }, [page, search, filterBuyer, filterPayment, filterStatus, filterWarehouse, sortOrder]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    api.get('/buyers?limit=100').then(r => { if (r.data.success) setBuyers(r.data.data); });
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/orders/${deleteConfirm._id}`);
      toast.success('Order dihapus');
      setDeleteConfirm(null);
      fetchOrders();
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
    finally { setDeleteLoading(false); }
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams({ format });
      const res = await api.get(`/export/orders?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-order.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Export berhasil`);
    } catch { toast.error('Export gagal'); }
  };

  return (
    <Layout title="Data Order" subtitle="Database lengkap seluruh order Group Order">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Database Order</div>
            {pagination && <div className="card-subtitle">{pagination.total} total order</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('xlsx')}><Download size={14} /> Excel</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')}><Download size={14} /> CSV</button>
            <button className="btn btn-primary" onClick={() => { setEditOrder(null); setShowModal(true); }}>
              <Plus size={15} /> Tambah Order
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-input-wrap">
              <Search size={15} />
              <input type="text" className="search-input" placeholder="Cari order ID, item, buyer, resi..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="filter-select" value={filterBuyer} onChange={e => { setFilterBuyer(e.target.value); setPage(1); }}>
              <option value="">Semua Buyer</option>
              {buyers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select className="filter-select" value={filterPayment} onChange={e => { setFilterPayment(e.target.value); setPage(1); }}>
              <option value="">Semua Pembayaran</option>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filterWarehouse} onChange={e => { setFilterWarehouse(e.target.value); setPage(1); }}>
              <option value="">Semua Warehouse</option>
              {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        {/* Full detail table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>DP</th>
                <th>Fix</th>
                <th>Pelunasan</th>
                <th>Total Bayar</th>
                <th>Sisa</th>
                <th>Status Bayar</th>
                <th>Warehouse</th>
                <th>Resi</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={8} cols={16} /> : orders.length === 0 ? (
                <tr><td colSpan={16}>
                  <EmptyState icon={<Database size={32} />} title="Tidak ada data" message="Tambahkan order atau ubah filter" />
                </td></tr>
              ) : orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>{o.orderId}</td>
                  <td style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{o.buyer?.name}</td>
                  <td style={{ fontWeight: 500, fontSize: 13, maxWidth: 120 }}>
                    <span title={o.item}>{o.item?.slice(0, 18)}{o.item?.length > 18 ? '…' : ''}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{o.quantity}</td>
                  <td style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{formatCurrency(o.hargaJual)}</td>
                  <td style={{ fontSize: 12.5 }}>{o.dp > 0 ? formatCurrency(o.dp) : '-'}</td>
                  <td style={{ fontSize: 12.5 }}>{o.fixPrice > 0 ? formatCurrency(o.fixPrice) : '-'}</td>
                  <td style={{ fontSize: 12.5 }}>{o.pelunasan > 0 ? formatCurrency(o.pelunasan) : '-'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)', fontSize: 12.5 }}>{formatCurrency(o.totalPembayaran)}</td>
                  <td style={{ fontWeight: 700, color: o.sisaTagihan > 0 ? 'var(--danger)' : 'var(--success)', fontSize: 12.5 }}>{formatCurrency(o.sisaTagihan)}</td>
                  <td><PaymentBadge status={o.paymentStatus} /></td>
                  <td>{o.warehouse ? <span className="badge badge-info" style={{ fontSize: 11 }}>{o.warehouse}</span> : '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.nomorResi}>{o.nomorResi || '-'}</td>
                  <td><StatusBadge status={o.statusBarang} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateShort(o.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Detail" onClick={() => setDetailOrder(o)}><Eye size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => { setEditOrder(o); setShowModal(true); }}><Edit size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Hapus" onClick={() => setDeleteConfirm(o)}><Trash2 size={13} /></button>
                    </div>
                  </td>
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

      {showModal && <OrderModal order={editOrder} buyers={buyers} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchOrders(); }} />}
      {detailOrder && <OrderDetail order={detailOrder} onClose={() => setDetailOrder(null)} onEdit={() => { setEditOrder(detailOrder); setDetailOrder(null); setShowModal(true); }} isSeller={true} />}
      <ConfirmDialog isOpen={!!deleteConfirm} title="Hapus Order" message={`Hapus order ${deleteConfirm?.orderId}?`} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} loading={deleteLoading} />
    </Layout>
  );
}
