import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';

const StatusBadge = ({ status }) => {
  const map = {
    active: { label: 'Active', color: '#10b981', bg: '#d1fae5' },
    suspended: { label: 'Suspended', color: '#f59e0b', bg: '#fef3c7' },
    disabled: { label: 'Disabled', color: '#ef4444', bg: '#fee2e2' },
  };
  const cfg = map[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
};

const Modal = ({ show, title, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">{title}</h3><button className="btn-icon" onClick={onClose}>✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ show, message, onConfirm, onCancel, loading }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '420px' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>{message}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Batal</button>
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Loading...' : 'Ya, Lanjutkan'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const emptyForm = { name: '', namaGO: '', username: '', email: '', whatsapp: '', password: '', notes: '', status: 'active' };

export default function SellerManagement() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editSeller, setEditSeller] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showResetPwd, setShowResetPwd] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await api.get('/owner/sellers', { params });
      setSellers(r.data.data);
      setPagination(r.data.pagination);
    } catch { showToast('Gagal memuat data', 'error'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditSeller(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s) => {
    setEditSeller(s);
    setForm({ name: s.user?.name || '', namaGO: s.namaGO || '', username: s.user?.username || '', email: s.user?.email || '', whatsapp: s.whatsapp || '', password: '', notes: s.notes || '', status: s.status });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editSeller) {
        await api.put(`/owner/sellers/${editSeller._id}`, form);
        showToast('Seller diperbarui');
      } else {
        await api.post('/owner/sellers', form);
        showToast('Seller berhasil dibuat');
      }
      setShowModal(false);
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Gagal menyimpan', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = (seller, action, label) => {
    setConfirm({
      message: `Apakah Anda yakin ingin ${label} Seller ${seller.user?.name}?`,
      onConfirm: async () => {
        try {
          await api.patch(`/owner/sellers/${seller._id}/status`, { action });
          showToast(`Seller berhasil di-${label}`);
          load();
        } catch { showToast('Gagal mengubah status', 'error'); }
        finally { setConfirm(null); }
      },
    });
  };

  const handleDelete = (seller) => {
    setConfirm({
      message: `Apakah Anda yakin ingin menghapus Seller ${seller.user?.name}? Data historis akan tetap tersimpan (soft delete).`,
      onConfirm: async () => {
        try {
          await api.delete(`/owner/sellers/${seller._id}`);
          showToast('Seller dihapus (soft delete)');
          load();
        } catch { showToast('Gagal menghapus', 'error'); }
        finally { setConfirm(null); }
      },
    });
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return showToast('Password minimal 6 karakter', 'error');
    try {
      await api.patch(`/owner/sellers/${showResetPwd._id}/reset-password`, { newPassword });
      showToast('Password berhasil direset');
      setShowResetPwd(null);
      setNewPassword('');
    } catch { showToast('Gagal reset password', 'error'); }
  };

  return (
    <Layout title="Seller Management" subtitle="Kelola semua akun Seller">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <ConfirmDialog show={!!confirm} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />

      {/* Reset Password Modal */}
      <Modal show={!!showResetPwd} title={`Reset Password — ${showResetPwd?.user?.name}`} onClose={() => { setShowResetPwd(null); setNewPassword(''); }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Password Baru</label>
            <input className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 karakter" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => { setShowResetPwd(null); setNewPassword(''); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleResetPassword}>Reset Password</button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal show={showModal} title={editSeller ? 'Edit Seller' : 'Tambah Seller Baru'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Nama Seller *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nama lengkap" />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Toko / GO</label>
              <input className="form-input" value={form.namaGO} onChange={e => setForm(f => ({ ...f, namaGO: e.target.value }))} placeholder="Nama Group Order" />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Opsional, untuk login" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input className="form-input" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="08xxx" />
            </div>
            {!editSeller && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editSeller} placeholder="Min. 6 karakter" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan opsional..." />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : editSeller ? 'Simpan Perubahan' : 'Tambah Seller'}</button>
          </div>
        </form>
      </Modal>

      {/* Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-input" style={{ flex: '1', minWidth: '200px', maxWidth: '320px' }} placeholder="Cari nama, email, GO..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="form-select" style={{ width: '160px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openCreate}>+ Tambah Seller</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
          <table className="table">
            <thead>
              <tr>
                <th>Seller ID</th>
                <th>Nama Seller</th>
                <th>Nama GO</th>
                <th>Username</th>
                <th>Email</th>
                <th>WA</th>
                <th style={{ textAlign: 'right' }}>Total Order</th>
                <th style={{ textAlign: 'right' }}>Total Transaksi</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(s => (
                <tr key={s._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem' }}>{s.sellerId}</td>
                  <td style={{ fontWeight: 600 }}>{s.user?.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.namaGO}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.user?.username ? `@${s.user.username}` : '-'}</td>
                  <td style={{ fontSize: '0.82rem' }}>{s.user?.email}</td>
                  <td style={{ fontSize: '0.82rem' }}>{s.whatsapp || '-'}</td>
                  <td style={{ textAlign: 'right' }}>{s.totalOrder || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(s.totalTransaksi || 0)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.user?.lastLogin ? formatDate(s.user.lastLogin) : 'Belum login'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'nowrap', alignItems: 'center' }}>
                      <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => navigate(`/owner/sellers/${s._id}`)}>Detail</button>
                      <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => openEdit(s)}>Edit</button>
                      {s.status === 'active'
                        ? <button className="btn btn-sm" style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => handleStatusChange(s, 'suspend', 'suspend')}>Suspend</button>
                        : <button className="btn btn-sm" style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => handleStatusChange(s, 'activate', 'aktifkan')}>Aktifkan</button>
                      }
                      <button className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => { setShowResetPwd(s); setNewPassword(''); }}>Reset PWD</button>
                      <button className="btn btn-sm btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem', whiteSpace: 'nowrap' }} onClick={() => handleDelete(s)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {sellers.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Belum ada seller</td></tr>
              )}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem' }}>
            <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button key={i} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="btn btn-sm btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
