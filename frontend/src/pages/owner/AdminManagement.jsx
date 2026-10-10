import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = { name: '', username: '', email: '', whatsapp: '', password: '', isActive: true };

const Modal = ({ show, title, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
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
            <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Loading...' : 'Ya, Hapus'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminManagement() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/owner/admins');
      setAdmins(r.data.data);
    } catch { showToast('Gagal memuat data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditAdmin(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (admin) => {
    setEditAdmin(admin);
    setForm({ name: admin.name || '', username: admin.username || '', email: admin.email || '', whatsapp: admin.whatsapp || '', password: '', isActive: admin.isActive });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editAdmin && form.password.length < 8) {
      return showToast('Password minimal 8 karakter', 'error');
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editAdmin) {
        await api.put(`/owner/admins/${editAdmin._id}`, payload);
        showToast('Admin diperbarui ✓');
      } else {
        await api.post('/owner/admins', payload);
        showToast('Admin berhasil dibuat ✓');
      }
      setShowModal(false);
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Gagal menyimpan', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = (admin) => {
    if (admin._id === currentUser?._id) return showToast('Tidak dapat menghapus akun sendiri', 'error');
    setConfirm({
      message: `Apakah Anda yakin ingin menghapus akun admin "${admin.name}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          await api.delete(`/owner/admins/${admin._id}`);
          showToast('Admin dihapus ✓');
          load();
        } catch (err) { showToast(err.response?.data?.message || 'Gagal menghapus', 'error'); }
        finally { setConfirm(null); }
      },
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Layout title="Admin Management" subtitle="Kelola akun Super Admin sistem">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      <ConfirmDialog show={!!confirm} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />

      {/* Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(139,92,246,0.06))',
        border: '1px solid rgba(167,139,250,0.25)',
        borderRadius: '10px',
        padding: '0.875rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
      }}>
        🛡️ <span><strong>Admin Management:</strong> Kelola akun Super Admin. Setiap Super Admin memiliki akses penuh ke seluruh sistem. Gunakan fitur ini dengan hati-hati.</span>
      </div>

      {/* Create Modal */}
      <Modal show={showModal} title={editAdmin ? `Edit Admin — ${editAdmin.name}` : 'Tambah Admin Baru'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Opsional" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input className="form-input" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="08xxx" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">{editAdmin ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password * (min. 8 karakter)'}</label>
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!editAdmin}
                placeholder={editAdmin ? 'Kosongkan jika tidak diubah' : 'Min. 8 karakter'}
                minLength={editAdmin ? 0 : 8}
              />
            </div>
            {editAdmin && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Akun Aktif
                </label>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : editAdmin ? 'Simpan Perubahan' : '+ Tambah Admin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toolbar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Total <strong>{admins.length}</strong> akun Super Admin
          </span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Tambah Admin</button>
      </div>

      {/* Admin list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div className="loading-spinner" style={{ margin: '3rem auto', gridColumn: '1 / -1' }} />
        ) : admins.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', gridColumn: '1 / -1' }}>
            Belum ada admin
          </div>
        ) : admins.map(admin => (
          <div key={admin._id} className="card" style={{
            padding: '1.25rem',
            border: admin._id === currentUser?._id ? '2px solid var(--primary)' : '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.875rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '1rem',
              }}>
                {getInitials(admin.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{admin.name}</h4>
                  {admin._id === currentUser?._id && (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(99,102,241,0.12)', color: '#6366f1', padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: 700 }}>
                      Anda
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.5rem',
                    borderRadius: '999px',
                    background: admin.isActive ? '#d1fae5' : '#fee2e2',
                    color: admin.isActive ? '#065f46' : '#991b1b',
                  }}>
                    {admin.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(167,139,250,0.15)', color: '#7c3aed', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>
                    🛡️ Super Admin
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {admin.username && <span>@{admin.username}</span>}
              {admin.email && <span>📧 {admin.email}</span>}
              {admin.whatsapp && <span>📱 {admin.whatsapp}</span>}
              <span>Bergabung: {formatDate(admin.createdAt)}</span>
              <span>Last login: {admin.lastLogin ? formatDate(admin.lastLogin) : 'Belum pernah'}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => openEdit(admin)} style={{ flex: 1 }}>Edit</button>
              {admin._id !== currentUser?._id && (
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(admin)}>Hapus</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
