import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { StockBadge, ConfirmDialog, SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDateShort, WAREHOUSES } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, Package, X, Minus } from 'lucide-react';

function StockModal({ stock, buyers, onClose, onSave }) {
  const isEdit = !!stock;
  const [form, setForm] = useState({
    namaBarang: '', variant: '', quantity: 1, harga: '', buyerId: '',
    warehouse: '', status: 'Waiting Arrival', notes: '', tanggalMasuk: '',
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(stock?.foto || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock) {
      setForm({
        namaBarang: stock.namaBarang || '',
        variant: stock.variant || '',
        quantity: stock.quantity || 1,
        harga: stock.harga || '',
        buyerId: stock.buyer?._id || stock.buyer || '',
        warehouse: stock.warehouse || '',
        status: stock.status || 'Waiting Arrival',
        notes: stock.notes || '',
        tanggalMasuk: stock.tanggalMasuk ? new Date(stock.tanggalMasuk).toISOString().slice(0, 10) : '',
      });
      setFotoPreview(stock.foto || null);
    }
  }, [stock]);

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.namaBarang.trim()) { toast.error('Nama barang wajib diisi'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k === 'buyerId' ? 'buyerId' : k, v); });
      if (foto) fd.append('foto', foto);

      if (isEdit) {
        await api.put(`/stocks/${stock._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Stok diperbarui');
      } else {
        await api.post('/stocks', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Stok ditambahkan');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan stok');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Stok' : 'Tambah Stok'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Photo */}
            <div className="form-group">
              <label className="form-label">Foto Barang</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {fotoPreview && (
                  <img src={fotoPreview} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius)', border: '2px solid var(--border)' }} />
                )}
                <input type="file" accept="image/*" onChange={handleFoto} style={{ fontSize: 13 }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Nama Barang</label>
                <input className="form-control" value={form.namaBarang} onChange={e => setForm(f => ({ ...f, namaBarang: e.target.value }))} placeholder="Nama barang" required />
              </div>
              <div className="form-group">
                <label className="form-label">Variant</label>
                <input className="form-control" value={form.variant} onChange={e => setForm(f => ({ ...f, variant: e.target.value }))} placeholder="Size, warna, dll" />
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-control" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Harga</label>
                <input type="number" className="form-control" value={form.harga} onChange={e => setForm(f => ({ ...f, harga: e.target.value }))} placeholder="0" min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {['Available', 'Reserved', 'Sold', 'Waiting Arrival'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Pemilik (Buyer)</label>
                <select className="form-control" value={form.buyerId} onChange={e => setForm(f => ({ ...f, buyerId: e.target.value }))}>
                  <option value="">Tanpa pemilik</option>
                  {buyers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Warehouse</label>
                <select className="form-control" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}>
                  <option value="">Pilih warehouse...</option>
                  {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Masuk</label>
                <input type="date" className="form-control" value={form.tanggalMasuk} onChange={e => setForm(f => ({ ...f, tanggalMasuk: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan</label>
                <input className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan..." />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Tambah Stok')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellerStok() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [buyers, setBuyers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editStock, setEditStock] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [qtyModal, setQtyModal] = useState(null);
  const [qtyAmount, setQtyAmount] = useState('');
  const [qtyType, setQtyType] = useState('add');

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15, search,
        ...(filterBuyer && { buyerId: filterBuyer }),
        ...(filterWarehouse && { warehouse: filterWarehouse }),
        ...(filterStatus && { status: filterStatus }),
      });
      const res = await api.get(`/stocks?${params}`);
      if (res.data.success) { setStocks(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat stok'); }
    finally { setLoading(false); }
  }, [page, search, filterBuyer, filterWarehouse, filterStatus]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);
  useEffect(() => {
    api.get('/buyers?limit=100').then(r => { if (r.data.success) setBuyers(r.data.data); });
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/stocks/${deleteConfirm._id}`);
      toast.success('Stok dihapus');
      setDeleteConfirm(null);
      fetchStocks();
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal menghapus'); }
    finally { setDeleteLoading(false); }
  };

  const handleQtyAdjust = async () => {
    if (!qtyAmount || isNaN(qtyAmount) || parseInt(qtyAmount) <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }
    try {
      await api.patch(`/stocks/${qtyModal._id}/quantity`, { adjustment: parseInt(qtyAmount), type: qtyType });
      toast.success(`Quantity berhasil ${qtyType === 'add' ? 'ditambah' : 'dikurangi'}`);
      setQtyModal(null);
      setQtyAmount('');
      fetchStocks();
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
  };

  return (
    <Layout title="Stok Barang" subtitle="Kelola inventori barang Group Order">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Daftar Stok</div>
          <button className="btn btn-primary" onClick={() => { setEditStock(null); setShowModal(true); }}>
            <Plus size={15} /> Tambah Stok
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-input-wrap">
              <Search size={15} />
              <input type="text" className="search-input" placeholder="Cari nama barang, variant..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="filter-select" value={filterBuyer} onChange={e => { setFilterBuyer(e.target.value); setPage(1); }}>
              <option value="">Semua Pemilik</option>
              {buyers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select className="filter-select" value={filterWarehouse} onChange={e => { setFilterWarehouse(e.target.value); setPage(1); }}>
              <option value="">Semua Warehouse</option>
              {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              {['Available', 'Reserved', 'Sold', 'Waiting Arrival'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nama Barang</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Pemilik</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={6} cols={9} /> : stocks.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon={<Package size={32} />} title="Belum ada stok" message="Tambahkan barang ke inventori" />
                </td></tr>
              ) : stocks.map(s => (
                <tr key={s._id}>
                  <td>
                    {s.foto ? (
                      <img src={s.foto} alt={s.namaBarang} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: 48, height: 48, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{s.namaBarang}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{s.variant || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{s.quantity}</span>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: 22, height: 22 }}
                        onClick={() => { setQtyModal(s); setQtyType('add'); setQtyAmount(''); }}
                        title="Atur quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{formatCurrency(s.harga)}</td>
                  <td style={{ fontSize: 13 }}>{s.buyer?.name || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                  <td>{s.warehouse ? <span className="badge badge-info">{s.warehouse}</span> : <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                  <td><StockBadge status={s.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => { setEditStock(s); setShowModal(true); }}><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Hapus" onClick={() => setDeleteConfirm(s)}><Trash2 size={14} /></button>
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

      {/* Qty Modal */}
      {qtyModal && (
        <div className="modal-overlay" onClick={() => setQtyModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Atur Quantity — {qtyModal.namaBarang}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setQtyModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Quantity saat ini: <strong>{qtyModal.quantity}</strong>
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className={`btn flex-1 ${qtyType === 'add' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setQtyType('add')}>
                  <Plus size={14} /> Tambah
                </button>
                <button className={`btn flex-1 ${qtyType === 'subtract' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setQtyType('subtract')}>
                  <Minus size={14} /> Kurangi
                </button>
              </div>
              <input type="number" className="form-control" value={qtyAmount} onChange={e => setQtyAmount(e.target.value)} placeholder="Jumlah" min={1} autoFocus />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setQtyModal(null)}>Batal</button>
              <button className={`btn ${qtyType === 'add' ? 'btn-primary' : 'btn-danger'}`} onClick={handleQtyAdjust}>
                {qtyType === 'add' ? 'Tambah' : 'Kurangi'} Quantity
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <StockModal stock={editStock} buyers={buyers} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchStocks(); }} />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Stok"
        message={`Hapus stok "${deleteConfirm?.namaBarang}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
