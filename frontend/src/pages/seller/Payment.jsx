import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { PaymentBadge, ConfirmDialog, SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDate, formatDateShort, PAYMENT_METHODS, PAYMENT_STATUSES } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, CreditCard, X } from 'lucide-react';

function PaymentModal({ payment, orders, buyers, onClose, onSave }) {
  const isEdit = !!payment;
  const [form, setForm] = useState({
    orderId: '', buyerId: '', amount: '', type: 'DP',
    method: 'Transfer Bank', tanggal: new Date().toISOString().slice(0, 10), notes: '',
  });
  const [orderSearch, setOrderSearch] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setForm({
        orderId: payment.order?._id || payment.order || '',
        buyerId: payment.buyer?._id || payment.buyer || '',
        amount: payment.amount || '',
        type: payment.type || 'DP',
        method: payment.method || 'Bank Transfer',
        tanggal: payment.tanggal ? new Date(payment.tanggal).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: payment.notes || '',
      });
    }
  }, [payment]);

  useEffect(() => {
    if (orderSearch.length > 1) {
      setFilteredOrders(orders.filter(o =>
        o.orderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.item?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.buyer?.name?.toLowerCase().includes(orderSearch.toLowerCase())
      ).slice(0, 8));
    } else {
      setFilteredOrders([]);
    }
  }, [orderSearch, orders]);

  const selectOrder = (o) => {
    setForm(f => ({ ...f, orderId: o._id, buyerId: o.buyer?._id || o.buyer, amount: o.sisaTagihan || '' }));
    setOrderSearch(`${o.orderId} - ${o.item}`);
    setFilteredOrders([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.buyerId || !form.amount || !form.method) {
      toast.error('Semua field wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (isEdit) {
        await api.put(`/payments/${payment._id}`, payload);
        toast.success('Pembayaran diperbarui');
      } else {
        await api.post('/payments', payload);
        toast.success('Pembayaran dicatat');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Pembayaran' : 'Catat Pembayaran'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Order Search */}
            {!isEdit && (
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label required">Order</label>
                <input
                  className="form-control"
                  placeholder="Cari order ID atau nama barang..."
                  value={orderSearch}
                  onChange={e => { setOrderSearch(e.target.value); setForm(f => ({ ...f, orderId: '', buyerId: '' })); }}
                />
                {filteredOrders.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', maxHeight: 200, overflowY: 'auto',
                  }}>
                    {filteredOrders.map(o => (
                      <div
                        key={o._id}
                        onClick={() => selectOrder(o)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{o.orderId}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.item} — {o.buyer?.name} — Sisa: {formatCurrency(o.sisaTagihan)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {form.orderId && (
                  <div className="form-hint" style={{ color: 'var(--success)' }}>✓ Order dipilih</div>
                )}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Jumlah (Rp)</label>
                <input type="number" className="form-control" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" min={0} required />
              </div>
              <div className="form-group">
                <label className="form-label required">Tipe Pembayaran</label>
                <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="DP">DP</option>
                  <option value="Pelunasan">Pelunasan</option>
                  <option value="Partial">Partial</option>
                  <option value="Full">Full / Lunas</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Metode Pembayaran</label>
                <select className="form-control" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Pembayaran</label>
                <input type="date" className="form-control" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Catatan pembayaran..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Catat Pembayaran')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellerPayment() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editPayment, setEditPayment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...(filterBuyer && { buyerId: filterBuyer }) });
      const res = await api.get(`/payments?${params}`);
      if (res.data.success) { setPayments(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat pembayaran'); }
    finally { setLoading(false); }
  }, [page, filterBuyer]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => {
    api.get('/buyers?limit=100').then(r => { if (r.data.success) setBuyers(r.data.data); });
    api.get('/orders?limit=200').then(r => { if (r.data.success) setOrders(r.data.data); });
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/payments/${deleteConfirm._id}`);
      toast.success('Pembayaran dihapus');
      setDeleteConfirm(null);
      fetchPayments();
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal menghapus'); }
    finally { setDeleteLoading(false); }
  };

  // Summary totals
  const totalDP = payments.filter(p => p.type === 'DP' || p.type === 'Partial').reduce((s, p) => s + p.amount, 0);
  const totalPelunasan = payments.filter(p => p.type === 'Pelunasan' || p.type === 'Full').reduce((s, p) => s + p.amount, 0);

  return (
    <Layout title="Payment" subtitle="Kelola pembayaran seluruh buyer">
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Transaksi', value: pagination?.total || 0, color: 'var(--primary)' },
          { label: 'Total DP', value: formatCurrency(totalDP), color: '#f59e0b' },
          { label: 'Total Pelunasan', value: formatCurrency(totalPelunasan), color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Riwayat Pembayaran</div>
          <button className="btn btn-primary" onClick={() => { setEditPayment(null); setShowModal(true); }}>
            <Plus size={15} /> Catat Pembayaran
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <select className="filter-select" value={filterBuyer} onChange={e => { setFilterBuyer(e.target.value); setPage(1); }}>
              <option value="">Semua Buyer</option>
              {buyers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Order</th>
                <th>Nominal</th>
                <th>Tipe</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={8} cols={9} /> : payments.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon={<CreditCard size={32} />} title="Belum ada pembayaran" message="Catat pembayaran pertama dari buyer" />
                </td></tr>
              ) : payments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{p.buyer?.name}</td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--primary)', fontFamily: 'monospace' }}>{p.order?.orderId}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.order?.item?.slice(0, 20)}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                  <td><span className="badge badge-info">{p.type}</span></td>
                  <td><span className="badge badge-gray">{p.method}</span></td>
                  <td>
                    <span className={`badge ${p.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateShort(p.tanggal)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 120 }}>
                    <span title={p.notes}>{p.notes?.slice(0, 20) || '-'}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditPayment(p); setShowModal(true); }} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(p)} title="Hapus">
                        <Trash2 size={14} />
                      </button>
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

      {showModal && (
        <PaymentModal
          payment={editPayment}
          orders={orders}
          buyers={buyers}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchPayments(); }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Pembayaran"
        message={`Hapus pembayaran ${formatCurrency(deleteConfirm?.amount)} dari ${deleteConfirm?.buyer?.name}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
