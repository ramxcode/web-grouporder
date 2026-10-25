import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { ConfirmDialog, SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDate, formatDateShort } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Icon from '../../components/Icon';

function BuyerModal({ buyer, onClose, onSave }) {
  const isEdit = !!buyer;
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '', address: '', notes: '', status: 'active', createAccount: false, password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (buyer) setForm({ name: buyer.name || '', whatsapp: buyer.whatsapp || '', email: buyer.email || '', address: buyer.address || '', notes: buyer.notes || '', status: buyer.status || 'active', createAccount: false, password: '' });
  }, [buyer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!form.name.trim()) e2.name = 'Nama wajib diisi';
    if (form.createAccount && !form.password) e2.password = 'Password wajib diisi untuk akun buyer';
    setErrors(e2);
    if (Object.keys(e2).length) return;

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/buyers/${buyer._id}`, form);
        toast.success('Buyer diperbarui');
      } else {
        await api.post('/buyers', form);
        toast.success('Buyer ditambahkan');
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
          <h3 className="modal-title">{isEdit ? `Edit Buyer — ${buyer.name}` : 'Tambah Buyer Baru'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="X" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Nama Buyer</label>
              <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap buyer" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nomor WhatsApp</label>
                <input className="form-control" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Alamat</label>
              <input className="form-control" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Alamat buyer" />
            </div>
            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Catatan tentang buyer..." />
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            {!isEdit && (
              <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <label className="checkbox-wrap" style={{ marginBottom: form.createAccount ? 12 : 0 }}>
                  <input type="checkbox" checked={form.createAccount} onChange={e => setForm(f => ({ ...f, createAccount: e.target.checked }))} />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Buat akun login untuk buyer ini</span>
                </label>
                {form.createAccount && (
                  <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                    <label className="form-label required">Password Akun Buyer</label>
                    <input type="password" className={`form-control ${errors.password ? 'error' : ''}`} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 karakter" />
                    {errors.password && <div className="form-error">{errors.password}</div>}
                    <div className="form-hint">Buyer akan login menggunakan email/WA dan password ini</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Buyer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BuyerDetail({ buyerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/buyers/${buyerId}`).then(r => { if (r.data.success) setData(r.data.data); }).finally(() => setLoading(false));
  }, [buyerId]);

  const { buyer, orders = [], payments = [], stocks = [], summary = {} } = data || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Detail Buyer</h3>
            {buyer && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{buyer.name}</span>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="X" size={18} /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { l: 'Total Order', v: summary.totalOrder || 0 },
                  { l: 'Total Belanja', v: formatCurrency(summary.totalBelanja) },
                  { l: 'Total Bayar', v: formatCurrency(summary.totalPembayaran) },
                  { l: 'Sisa Tagihan', v: formatCurrency(summary.sisaTagihan), c: 'var(--danger)' },
                ].map(s => (
                  <div key={s.l} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{s.l}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: s.c || 'var(--text)' }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 16px' }}><div className="card-title" style={{ fontSize: 13 }}>Informasi Buyer</div></div>
                  <div className="card-body" style={{ padding: '12px 16px', fontSize: 13 }}>
                    <div style={{ marginBottom: 8 }}><strong>WA:</strong> {buyer?.whatsapp ? <a href={`https://wa.me/${buyer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--success)' }}>{buyer.whatsapp}</a> : '-'}</div>
                    <div style={{ marginBottom: 8 }}><strong>Email:</strong> {buyer?.email || '-'}</div>
                    <div style={{ marginBottom: 8 }}><strong>Bergabung:</strong> {formatDate(buyer?.createdAt)}</div>
                    <div><strong>Akun:</strong> {buyer?.userAccount ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-gray">Belum Ada</span>}</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 16px' }}><div className="card-title" style={{ fontSize: 13 }}>Stok Barang ({stocks.length})</div></div>
                  <div className="card-body" style={{ padding: '12px 16px', fontSize: 13, maxHeight: 120, overflowY: 'auto' }}>
                    {stocks.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>Belum ada stok</span> : stocks.map(s => (
                      <div key={s._id} style={{ marginBottom: 4 }}>• {s.namaBarang} {s.variant && `(${s.variant})`} × {s.quantity}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header" style={{ padding: '12px 16px' }}><div className="card-title" style={{ fontSize: 13 }}>Order ({orders.length})</div></div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: 12.5 }}>
                    <thead><tr><th>Order ID</th><th>Item</th><th>Harga</th><th>Status Bayar</th><th>Status</th></tr></thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o._id}>
                          <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>{o.orderId}</td>
                          <td>{o.item}</td>
                          <td>{formatCurrency(o.hargaJual)}</td>
                          <td><span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-success' : o.paymentStatus === 'DP' ? 'badge-warning' : 'badge-danger'}`}>{o.paymentStatus}</span></td>
                          <td><span className={`badge ${getStatusBadgeClass(o.statusBarang)}`}>{o.statusBarang}</span></td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada order</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments */}
              <div className="card">
                <div className="card-header" style={{ padding: '12px 16px' }}><div className="card-title" style={{ fontSize: 13 }}>Riwayat Pembayaran ({payments.length})</div></div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: 12.5 }}>
                    <thead><tr><th>Tanggal</th><th>Nominal</th><th>Tipe</th><th>Metode</th></tr></thead>
                    <tbody>
                      {payments.slice(0, 5).map(p => (
                        <tr key={p._id}>
                          <td>{formatDateShort(p.tanggal)}</td>
                          <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                          <td><span className="badge badge-info">{p.type}</span></td>
                          <td>{p.method}</td>
                        </tr>
                      ))}
                      {payments.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada pembayaran</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeClass(status) {
  const map = {
    'Ordered': 'status-ordered', 'WH KR': 'status-wh-kr', 'WH JP': 'status-wh-jp',
    'WH Taiwan': 'status-wh-taiwan', 'WH Thai': 'status-wh-thai', 'WH US': 'status-wh-us',
    'Arrived INA': 'status-arrived-ina', 'Arrived Admin': 'status-arrived-admin', 'Done CO': 'status-done-co',
  };
  return map[status] || 'badge-gray';
}

export default function Buyers() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBuyer, setEditBuyer] = useState(null);
  const [viewBuyer, setViewBuyer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/buyers?page=${page}&limit=15&search=${search}`);
      if (res.data.success) { setBuyers(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat buyer'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchBuyers(); }, [fetchBuyers]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/buyers/${deleteConfirm._id}`);
      toast.success('Buyer dihapus');
      setDeleteConfirm(null);
      fetchBuyers();
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal menghapus'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <Layout title="Buyer" subtitle="Kelola data seluruh buyer">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Daftar Buyer</div>
            {pagination && <div className="card-subtitle">{pagination.total} buyer terdaftar</div>}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditBuyer(null); setShowModal(true); }}>
            <Icon name="Plus" size={15} /> Tambah Buyer
          </button>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="search-input-wrap" style={{ maxWidth: 360 }}>
            <Icon name="Search" size={15} />
            <input type="text" className="search-input" placeholder="Cari nama, email, WA..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Buyer</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>Total Order</th>
                <th>Total Tagihan</th>
                <th>Total Bayar</th>
                <th>Sisa Tagihan</th>
                <th>Akun</th>
                <th>Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows rows={6} cols={10} /> : buyers.length === 0 ? (
                <tr><td colSpan={10}>
                  <EmptyState icon={<Icon name="Users" size={32} />} title="Belum ada buyer" message="Tambahkan buyer pertama" />
                </td></tr>
              ) : buyers.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {b.name?.[0]?.toUpperCase()}
                      </div>
                      {b.name}
                    </div>
                  </td>
                  <td>
                    {b.whatsapp ? (
                      <a href={`https://wa.me/${b.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="MessageCircle" size={13} />{b.whatsapp}
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>{b.email || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                  <td style={{ fontWeight: 700 }}>{b.totalOrders}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(b.totalTagihan)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(b.totalPembayaran)}</td>
                  <td style={{ color: b.sisaTagihan > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{formatCurrency(b.sisaTagihan)}</td>
                  <td>{b.userAccount ? <span className="badge badge-success">Login</span> : <span className="badge badge-gray">-</span>}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateShort(b.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Detail" onClick={() => setViewBuyer(b._id)}><Icon name="Eye" size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => { setEditBuyer(b); setShowModal(true); }}><Icon name="Edit" size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} title="Hapus" onClick={() => setDeleteConfirm(b)}><Icon name="Trash2" size={14} /></button>
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

      {showModal && <BuyerModal buyer={editBuyer} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); fetchBuyers(); }} />}
      {viewBuyer && <BuyerDetail buyerId={viewBuyer} onClose={() => setViewBuyer(null)} />}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Buyer"
        message={`Hapus buyer "${deleteConfirm?.name}"? Buyer hanya bisa dihapus jika tidak memiliki order aktif.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
