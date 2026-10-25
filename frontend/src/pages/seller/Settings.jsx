import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Icon from '../../components/Icon';

export default function SellerSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    namaGroupOrder: '', whatsapp: '', email: '', defaultWarehouse: '',
    rekeningBank: [],
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);

  useEffect(() => {
    api.get('/settings').then(r => {
      if (r.data.success) {
        const s = r.data.data;
        setSettings(s);
        setForm({
          namaGroupOrder: s.namaGroupOrder || '',
          whatsapp: s.whatsapp || '',
          email: s.email || '',
          defaultWarehouse: s.defaultWarehouse || '',
          rekeningBank: s.rekeningBank || [],
        });
        setLogoPreview(s.logo || null);
        setQrisPreview(s.qrisImage || null);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('namaGroupOrder', form.namaGroupOrder);
      fd.append('whatsapp', form.whatsapp);
      fd.append('email', form.email);
      fd.append('defaultWarehouse', form.defaultWarehouse);
      fd.append('rekeningBank', JSON.stringify(form.rekeningBank));
      if (logoFile) fd.append('logo', logoFile);
      if (qrisFile) fd.append('qris', qrisFile);

      await api.put('/settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Pengaturan berhasil disimpan');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const addRekening = () => setForm(f => ({ ...f, rekeningBank: [...f.rekeningBank, { bankName: '', accountNumber: '', accountName: '' }] }));
  const updateRekening = (i, field, val) => setForm(f => ({ ...f, rekeningBank: f.rekeningBank.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));
  const removeRekening = (i) => setForm(f => ({ ...f, rekeningBank: f.rekeningBank.filter((_, idx) => idx !== i) }));

  if (loading) {
    return <Layout title="Pengaturan"><div style={{ padding: 40, textAlign: 'center' }}>Memuat...</div></Layout>;
  }

  return (
    <Layout title="Pengaturan" subtitle="Konfigurasi sistem WEB REKAPAN GO">
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Informasi GO */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Informasi Group Order</div>
            </div>
            <div className="card-body">
              {/* Logo */}
              <div className="form-group">
                <label className="form-label">Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {logoPreview && (
                    <img src={logoPreview} alt="logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                  )}
                  <input type="file" accept="image/*" onChange={e => { setLogoFile(e.target.files[0]); setLogoPreview(URL.createObjectURL(e.target.files[0])); }} style={{ fontSize: 13 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Group Order</label>
                <input className="form-control" value={form.namaGroupOrder} onChange={e => setForm(f => ({ ...f, namaGroupOrder: e.target.value }))} placeholder="WEB REKAPAN GO" />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input className="form-control" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="08xxxxxxxxxx" />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@example.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Default Warehouse</label>
                <select className="form-control" value={form.defaultWarehouse} onChange={e => setForm(f => ({ ...f, defaultWarehouse: e.target.value }))}>
                  <option value="">Pilih default warehouse...</option>
                  {['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Indonesia'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <div className="card mb-20" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">QRIS</div>
              </div>
              <div className="card-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Upload Gambar QRIS</label>
                  {qrisPreview && (
                    <img src={qrisPreview} alt="QRIS" style={{ width: 200, height: 200, objectFit: 'contain', display: 'block', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                  )}
                  <input type="file" accept="image/*" onChange={e => { setQrisFile(e.target.files[0]); setQrisPreview(URL.createObjectURL(e.target.files[0])); }} style={{ fontSize: 13 }} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Rekening Bank</div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addRekening}>
                  <Icon name="Plus" size={13} /> Tambah
                </button>
              </div>
              <div className="card-body">
                {form.rekeningBank.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
                    Belum ada rekening. Klik "Tambah" untuk menambahkan.
                  </div>
                ) : form.rekeningBank.map((r, i) => (
                  <div key={i} style={{ padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Rekening {i + 1}</span>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeRekening(i)}>
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <input className="form-control" placeholder="Nama Bank" value={r.bankName} onChange={e => updateRekening(i, 'bankName', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <input className="form-control" placeholder="Nomor Rekening" value={r.accountNumber} onChange={e => updateRekening(i, 'accountNumber', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input className="form-control" placeholder="Nama Pemilik Rekening" value={r.accountName} onChange={e => updateRekening(i, 'accountName', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            <Icon name="Save" size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
