import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { StatusBadge, PaymentBadge, ConfirmDialog, SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDateShort, STATUS_ORDER, WAREHOUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Edit, Trash2, Eye, ChevronUp, ChevronDown, Check } from 'lucide-react';
import OrderModal from './components/OrderModal';
import OrderDetail from './components/OrderDetail';

export default function StatusOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [buyers, setBuyers] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Selections
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15, search, sortOrder,
        ...(filterBuyer && { buyerId: filterBuyer }),
        ...(filterPayment && { paymentStatus: filterPayment }),
        ...(filterStatus && { statusBarang: filterStatus }),
        ...(filterWarehouse && { warehouse: filterWarehouse }),
      });
      const res = await api.get(`/orders?${params}`);
      if (res.data.success) {
        setOrders(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (e) {
      toast.error('Gagal memuat data order');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBuyer, filterPayment, filterStatus, filterWarehouse, sortOrder]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    api.get('/buyers?limit=100').then(r => { if (r.data.success) setBuyers(r.data.data); }).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/orders/${deleteConfirm._id}`);
      toast.success('Order berhasil dihapus');
      setDeleteConfirm(null);
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Gagal menghapus order');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!selected.length || !bulkStatus) { toast.error('Pilih order dan status'); return; }
    try {
      await api.patch('/orders/bulk-status', { orderIds: selected, statusBarang: bulkStatus });
      toast.success(`${selected.length} order diperbarui`);
      setSelected([]);
      setBulkStatus('');
      fetchOrders();
    } catch (e) {
      toast.error('Gagal update bulk status');
    }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === orders.length ? [] : orders.map(o => o._id));

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const clearFilters = () => { setSearch(''); setFilterBuyer(''); setFilterPayment(''); setFilterStatus(''); setFilterWarehouse(''); setPage(1); };

  const hasFilters = search || filterBuyer || filterPayment || filterStatus || filterWarehouse;

  return (
    <Layout title="Status Order" subtitle="Kelola seluruh order dan status pembayaran">
      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: 'var(--primary-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)',
          marginBottom: 16,
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>
            {selected.length} order dipilih
          </span>
          <select
            className="filter-select"
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">Ubah status ke...</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={handleBulkUpdate}>
            <Check size={14} /> Terapkan
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Batal</button>
        </div>
      )}

      <div className="card">
        {/* Header */}
        <div className="card-header">
          <div>
            <div className="card-title">Daftar Order</div>
            {pagination && <div className="card-subtitle">{pagination.total} total order</div>}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditOrder(null); setShowModal(true); }}>
            <Plus size={15} /> Tambah Order
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-input-wrap">
              <Search size={15} />
              <input
                type="text"
                className="search-input"
                placeholder="Cari order ID, item, buyer, resi..."
                value={search}
                onChange={handleSearch}
              />
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
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSortOrder(v => v === 'desc' ? 'asc' : 'desc')}
              title="Toggle sort"
            >
              {sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              Tanggal
            </button>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ color: 'var(--danger)' }}>
                Hapus Filter
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    checked={orders.length > 0 && selected.length === orders.length}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Item</th>
                <th>Harga</th>
                <th>DP</th>
                <th>Fix Price</th>
                <th>Pelunasan</th>
                <th>Status Bayar</th>
                <th>Status Barang</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={8} cols={12} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={12}>
                    <EmptyState
                      icon={<Search size={32} />}
                      title="Tidak ada order"
                      message={hasFilters ? "Coba ubah filter pencarian" : "Belum ada order yang dibuat"}
                      action={
                        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                          <Plus size={14} /> Tambah Order Pertama
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o._id} style={{ background: selected.includes(o._id) ? 'var(--primary-bg)' : '' }}>
                    <td>
                      <input type="checkbox"
                        checked={selected.includes(o._id)}
                        onChange={() => toggleSelect(o._id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        {o.orderId}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{o.buyer?.name}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{o.item}</div>
                      {o.quantity > 1 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>x{o.quantity}</div>}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{formatCurrency(o.hargaJual)}</td>
                    <td style={{ fontSize: 13 }}>{o.dp > 0 ? formatCurrency(o.dp) : <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                    <td style={{ fontSize: 13 }}>{o.fixPrice > 0 ? formatCurrency(o.fixPrice) : <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                    <td style={{ fontSize: 13 }}>{o.pelunasan > 0 ? formatCurrency(o.pelunasan) : <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                    <td><PaymentBadge status={o.paymentStatus} /></td>
                    <td><StatusBadge status={o.statusBarang} /></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDateShort(o.createdAt)}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Detail" onClick={() => setDetailOrder(o)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => { setEditOrder(o); setShowModal(true); }}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Hapus" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(o)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <OrderModal
          order={editOrder}
          buyers={buyers}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchOrders(); }}
        />
      )}

      {detailOrder && (
        <OrderDetail
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onEdit={() => { setEditOrder(detailOrder); setDetailOrder(null); setShowModal(true); }}
          isSeller={true}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Order"
        message={`Yakin ingin menghapus order ${deleteConfirm?.orderId}? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
