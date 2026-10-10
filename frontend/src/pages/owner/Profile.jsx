import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export default function OwnerProfile() {
  const { loadUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);

  // Form state
  const [form, setForm] = useState({ name: '', username: '', email: '', whatsapp: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const r = await api.get('/owner/profile');
      setProfile(r.data.data);
      const p = r.data.data;
      setForm({ name: p.name || '', username: p.username || '', email: p.email || '', whatsapp: p.whatsapp || '' });
    } catch (e) { showToast('Gagal memuat profil', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/owner/profile', form);
      showToast('Profil berhasil diperbarui ✓');
      loadUser(); // Refresh auth context
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan', 'error');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return showToast('Password baru tidak cocok', 'error');
    }
    if (pwdForm.newPassword.length < 8) {
      return showToast('Password minimal 8 karakter', 'error');
    }
    setSaving(true);
    try {
      await api.put('/owner/profile', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      showToast('Password berhasil diubah ✓');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengubah password', 'error');
    } finally { setSaving(false); }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  if (loading) return (
    <Layout title="Profile">
      <div className="loading-spinner" style={{ margin: '3rem auto' }} />
    </Layout>
  );

  const TABS = [
    { key: 'profile', label: '👤 Informasi Profil' },
    { key: 'password', label: '🔑 Ubah Password' },
    { key: 'history', label: '📋 Riwayat Login' },
  ];

  return (
    <Layout title="Profile Super Admin" subtitle="Kelola informasi akun Anda">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        {/* Profile card */}
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', height: 'fit-content' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white',
          }}>
            {profile?.avatar
              ? <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : getInitials(profile?.name)
            }
          </div>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{profile?.name}</h3>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(167,139,250,0.3)', borderRadius: '999px',
            padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa',
            margin: '0.5rem 0 1rem',
          }}>
            🛡️ Super Admin / Owner
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {profile?.email && <span>📧 {profile.email}</span>}
            {profile?.whatsapp && <span>📱 {profile.whatsapp}</span>}
            {profile?.username && <span>@{profile.username}</span>}
            <span style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Bergabung: {formatDate(profile?.createdAt)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Last login: {profile?.lastLogin ? formatDate(profile.lastLogin) : 'Belum pernah'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Informasi Profil</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap *</label>
                    <input
                      className="form-input"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      className="form-input"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="Opsional"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nomor WhatsApp</label>
                    <input
                      className="form-input"
                      value={form.whatsapp}
                      onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                      placeholder="08xxx"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 160 }}>
                    {saving ? 'Menyimpan...' : '💾 Simpan Profil'}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ubah Password</h3>
                <div style={{
                  padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.07)',
                  borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}>
                  🔒 Password minimal 8 karakter untuk keamanan akun Super Admin.
                </div>
                <div className="form-group">
                  <label className="form-label">Password Saat Ini *</label>
                  <input
                    className="form-input"
                    type="password"
                    value={pwdForm.currentPassword}
                    onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password Baru *</label>
                  <input
                    className="form-input"
                    type="password"
                    value={pwdForm.newPassword}
                    onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Konfirmasi Password Baru *</label>
                  <input
                    className="form-input"
                    type="password"
                    value={pwdForm.confirmPassword}
                    onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 160 }}>
                    {saving ? 'Mengubah...' : '🔑 Ubah Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Login History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Riwayat Login</h3>
                {(profile?.loginHistory || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                    Belum ada riwayat login
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(profile.loginHistory || []).map((h, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.6rem 0.75rem',
                        background: i === 0 ? 'rgba(99,102,241,0.06)' : 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: i === 0 ? '1px solid rgba(99,102,241,0.15)' : '1px solid transparent',
                      }}>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatDate(h.timestamp)}
                            {i === 0 && <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#6366f1', fontWeight: 700 }}>● Terakhir</span>}
                          </p>
                          {h.ipAddress && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              IP: {h.ipAddress}
                            </p>
                          )}
                        </div>
                        {h.userAgent && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 300, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.userAgent}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
