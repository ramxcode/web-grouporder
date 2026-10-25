import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const TABS = [
  { key: 'brand', label: '🎨 Branding' },
  { key: 'theme', label: '🖌️ Theme' },
  { key: 'general', label: '⚙️ General' },
  { key: 'contact', label: '📞 Kontak' },
  { key: 'maintenance', label: '🔧 Maintenance' },
  { key: 'payment', label: '💳 Payment Global' },
];

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
    <div style={{ position: 'relative', width: '44px', height: '24px' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: checked ? 'var(--primary)' : 'var(--border)', borderRadius: '12px', transition: 'background 0.2s', cursor: 'pointer' }} onClick={() => onChange(!checked)}>
        <div style={{ position: 'absolute', top: '2px', left: checked ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
      </div>
    </div>
    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</span>
  </label>
);

export default function WebsiteSettings() {
  const { refreshSettings, applyWebsiteSettingsToDOM } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('brand');
  const [toast, setToast] = useState(null);
  const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [newEwallet, setNewEwallet] = useState({ name: '', number: '' });
  const [confirm, setConfirm] = useState(false);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    try {
      const r = await api.get('/owner/website-settings');
      setSettings(r.data.data);
    } catch (e) { showToast('Gagal memuat settings', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);


  const updateField = (field, value) => {
    setSettings(s => {
      const updated = { ...s, [field]: value };
      // Apply to DOM immediately for realtime preview (colors, etc)
      applyWebsiteSettingsToDOM(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      delete payload._id; delete payload.__v; delete payload.createdAt; delete payload.updatedAt;
      await api.put('/owner/website-settings', payload);
      // Re-load settings from DB and apply globally (title, colors, favicon)
      await refreshSettings();
      showToast('Settings berhasil disimpan ✓');
    } catch { showToast('Gagal menyimpan', 'error'); }
    finally { setSaving(false); setConfirm(false); }
  };

  const addBank = () => {
    if (!newBank.bankName || !newBank.accountNumber) return;
    updateField('globalBankAccounts', [...(settings.globalBankAccounts || []), { ...newBank, isActive: true }]);
    setNewBank({ bankName: '', accountNumber: '', accountName: '' });
  };

  const removeBank = (i) => {
    const arr = [...(settings.globalBankAccounts || [])];
    arr.splice(i, 1);
    updateField('globalBankAccounts', arr);
  };

  const addEwallet = () => {
    if (!newEwallet.name) return;
    updateField('globalEwallets', [...(settings.globalEwallets || []), { ...newEwallet, isActive: true }]);
    setNewEwallet({ name: '', number: '' });
  };

  const removeEwallet = (i) => {
    const arr = [...(settings.globalEwallets || [])];
    arr.splice(i, 1);
    updateField('globalEwallets', arr);
  };

  if (loading) return <Layout title="Website Settings"><div className="loading-spinner" style={{ margin: '3rem auto' }} /></Layout>;

  return (
    <Layout title="Website Settings" subtitle="Konfigurasi global platform WEB REKAPAN GO">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Confirm */}
      {confirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ marginBottom: '1.5rem' }}>Perubahan settings akan diterapkan ke seluruh website. Lanjutkan?</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Ya, Simpan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', padding: '0.25rem 0' }}>
        {TABS.map(t => (
          <button key={t.key} className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`} style={{ whiteSpace: 'nowrap' }} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {/* --- BRANDING --- */}
        {activeTab === 'brand' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <h3 style={{ gridColumn: 'span 2', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Brand Settings</h3>
            {[
              ['siteName', 'Nama Website'],
              ['shortName', 'Short Name'],
              ['tagline', 'Tagline'],
              ['description', 'Deskripsi'],
              ['footerText', 'Footer Text'],
            ].map(([field, label]) => (
              <div key={field} className="form-group" style={{ gridColumn: ['description', 'tagline', 'footerText'].includes(field) ? 'span 2' : 'span 1' }}>
                <label className="form-label">{label}</label>
                {['description', 'tagline', 'footerText'].includes(field)
                  ? <textarea className="form-input" rows={2} value={settings[field] || ''} onChange={e => updateField(field, e.target.value)} />
                  : <input className="form-input" value={settings[field] || ''} onChange={e => updateField(field, e.target.value)} />
                }
              </div>
            ))}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Logo URL</label>
              <input className="form-input" value={settings.logo || ''} onChange={e => updateField('logo', e.target.value)} placeholder="URL gambar atau path upload" />
            </div>
            <div className="form-group">
              <label className="form-label">Logo Dark Mode URL</label>
              <input className="form-input" value={settings.logoDark || ''} onChange={e => updateField('logoDark', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Favicon URL</label>
              <input className="form-input" value={settings.favicon || ''} onChange={e => updateField('favicon', e.target.value)} />
            </div>
            {/* Developer / Footer link settings */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Developer Name (tampil di footer)</label>
              <input className="form-input" value={settings.developerName || ''} onChange={e => updateField('developerName', e.target.value)} placeholder="Contoh: RAMXCODE" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Developer Link (URL di footer)</label>
              <input className="form-input" value={settings.developerLink || ''} onChange={e => updateField('developerLink', e.target.value)} placeholder="Contoh: https://t.me/minramz" />
            </div>
          </div>
        )}


        {/* --- THEME --- */}
        {activeTab === 'theme' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <h3 style={{ gridColumn: 'span 2', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Theme Settings</h3>
            {[
              ['primaryColor', 'Primary Color'],
              ['secondaryColor', 'Secondary Color'],
              ['accentColor', 'Accent Color'],
              ['sidebarColor', 'Sidebar Color'],
              ['backgroundColor', 'Background Color'],
            ].map(([field, label]) => (
              <div key={field} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="form-label">{label}</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={settings[field] || '#6366f1'} onChange={e => updateField(field, e.target.value)} style={{ width: '44px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                  <input className="form-input" value={settings[field] || ''} onChange={e => updateField(field, e.target.value)} placeholder="#000000" style={{ flex: 1 }} />
                </div>
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Border Radius</label>
              <input className="form-input" value={settings.borderRadius || '10px'} onChange={e => updateField('borderRadius', e.target.value)} placeholder="8px, 12px, etc." />
            </div>
            <div className="form-group">
              <label className="form-label">Theme Mode</label>
              <select className="form-select" value={settings.themeMode || 'system'} onChange={e => updateField('themeMode', e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        )}

        {/* --- GENERAL --- */}
        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <h3 style={{ gridColumn: 'span 2', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>General Configuration</h3>
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <input className="form-input" value={settings.defaultCurrency || 'IDR'} onChange={e => updateField('defaultCurrency', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <input className="form-input" value={settings.timezone || 'Asia/Jakarta'} onChange={e => updateField('timezone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Order Prefix</label>
              <input className="form-input" value={settings.orderPrefix || 'GO'} onChange={e => updateField('orderPrefix', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Seller Prefix</label>
              <input className="form-input" value={settings.sellerPrefix || 'SELLER'} onChange={e => updateField('sellerPrefix', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Default Pagination</label>
              <input type="number" className="form-input" value={settings.defaultPagination || 20} onChange={e => updateField('defaultPagination', parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Session Timeout (menit)</label>
              <input type="number" className="form-input" value={settings.sessionTimeout || 10080} onChange={e => updateField('sessionTimeout', parseInt(e.target.value))} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
              <Toggle checked={settings.buyerRegistration || false} onChange={v => updateField('buyerRegistration', v)} label="Buyer Registration (Buyer bisa daftar sendiri)" />
              <Toggle checked={settings.notificationEnabled !== false} onChange={v => updateField('notificationEnabled', v)} label="Notifikasi Sistem" />
            </div>
          </div>
        )}

        {/* --- CONTACT --- */}
        {activeTab === 'contact' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <h3 style={{ gridColumn: 'span 2', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Contact Settings</h3>
            {[
              ['contactEmail', 'Email'],
              ['contactWhatsapp', 'WhatsApp'],
              ['contactInstagram', 'Instagram'],
              ['contactTiktok', 'TikTok'],
              ['contactTelegram', 'Telegram'],
              ['contactCsLink', 'Customer Service Link'],
            ].map(([field, label]) => (
              <div key={field} className="form-group">
                <label className="form-label">{label}</label>
                <input className="form-input" value={settings[field] || ''} onChange={e => updateField(field, e.target.value)} />
              </div>
            ))}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Alamat</label>
              <textarea className="form-input" rows={2} value={settings.contactAddress || ''} onChange={e => updateField('contactAddress', e.target.value)} />
            </div>
          </div>
        )}

        {/* --- MAINTENANCE --- */}
        {activeTab === 'maintenance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Maintenance Mode</h3>
            <div style={{ padding: '1rem', background: settings.maintenanceMode ? '#fef3c7' : 'var(--bg-tertiary)', border: `2px solid ${settings.maintenanceMode ? '#f59e0b' : 'var(--border)'}`, borderRadius: '10px' }}>
              <Toggle checked={settings.maintenanceMode || false} onChange={v => updateField('maintenanceMode', v)} label={settings.maintenanceMode ? '⚠️ MAINTENANCE AKTIF — Buyer & Seller tidak bisa akses' : '✅ Website Normal'} />
            </div>
            <div className="form-group">
              <label className="form-label">Judul Maintenance</label>
              <input className="form-input" value={settings.maintenanceTitle || ''} onChange={e => updateField('maintenanceTitle', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pesan Maintenance</label>
              <textarea className="form-input" rows={3} value={settings.maintenanceMessage || ''} onChange={e => updateField('maintenanceMessage', e.target.value)} />
            </div>
          </div>
        )}

        {/* --- PAYMENT --- */}
        {activeTab === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Global Payment Settings</h3>
            <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '10px' }}>
              <Toggle checked={settings.allowSellerCustomPayment !== false} onChange={v => updateField('allowSellerCustomPayment', v)} label="Izinkan Seller menambah metode pembayaran sendiri" />
            </div>

            {/* Bank Accounts */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Bank Transfer</h4>
              {(settings.globalBankAccounts || []).map((bank, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{bank.bankName}</strong> — {bank.accountNumber} — {bank.accountName}
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => removeBank(i)}>Hapus</button>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input className="form-input" placeholder="Nama Bank" value={newBank.bankName} onChange={e => setNewBank(b => ({ ...b, bankName: e.target.value }))} />
                <input className="form-input" placeholder="No. Rekening" value={newBank.accountNumber} onChange={e => setNewBank(b => ({ ...b, accountNumber: e.target.value }))} />
                <input className="form-input" placeholder="Nama Pemilik" value={newBank.accountName} onChange={e => setNewBank(b => ({ ...b, accountName: e.target.value }))} />
                <button className="btn btn-primary" onClick={addBank}>+ Tambah</button>
              </div>
            </div>

            {/* E-Wallet */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>E-Wallet</h4>
              {(settings.globalEwallets || []).map((ew, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem' }}><strong>{ew.name}</strong>{ew.number ? ` — ${ew.number}` : ''}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => removeEwallet(i)}>Hapus</button>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input className="form-input" placeholder="Nama (GoPay, DANA, OVO...)" value={newEwallet.name} onChange={e => setNewEwallet(ew => ({ ...ew, name: e.target.value }))} />
                <input className="form-input" placeholder="Nomor / Username" value={newEwallet.number} onChange={e => setNewEwallet(ew => ({ ...ew, number: e.target.value }))} />
                <button className="btn btn-primary" onClick={addEwallet}>+ Tambah</button>
              </div>
            </div>

            {/* QRIS */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>QRIS</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Nama Merchant QRIS</label>
                  <input className="form-input" value={settings.globalQrisMerchantName || ''} onChange={e => updateField('globalQrisMerchantName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Gambar QRIS</label>
                  <input className="form-input" value={settings.globalQris || ''} onChange={e => updateField('globalQris', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" onClick={() => setConfirm(true)} disabled={saving} style={{ minWidth: '160px' }}>
            {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
