import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency, STATUS_ORDER, WAREHOUSES, PAYMENT_METHODS } from '../../../lib/utils';
import Icon from '../../../components/Icon';

export default function OrderModal({ order, buyers, onClose, onSave }) {
  const isEdit = !!order;
  const [form, setForm] = useState({
    buyer: '',
    item: '',
    quantity: 1,
    website: '',
    hargaBeli: '',
    hargaJual: '',
    dp: '',
    fixPrice: '',
    pelunasan: '',
    warehouse: '',
    nomorResi: '',
    statusBarang: 'Ordered',
    notes: '',
    statusNote: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [stocks, setStocks] = useState([]);
  const [isManualItem, setIsManualItem] = useState(false);

  useEffect(() => {
    if (order) {
      setIsManualItem(true); // edit mode: always manual
      setForm({
        buyer: order.buyer?._id || order.buyer || '',
        item: order.item || '',
        quantity: order.quantity || 1,
        website: order.website || '',
        hargaBeli: order.hargaBeli || '',
        hargaJual: order.hargaJual || '',
        dp: order.dp || '',
        fixPrice: order.fixPrice || '',
        pelunasan: order.pelunasan || '',
        warehouse: order.warehouse || '',
        nomorResi: order.nomorResi || '',
        statusBarang: order.statusBarang || 'Ordered',
        notes: order.notes || '',
        statusNote: '',
      });
    }
  }, [order]);

  // Load stocks when buyer is selected (only on add mode)
  useEffect(() => {
    if (form.buyer && !isEdit) {
      api.get(`/stocks?buyerId=${form.buyer}&limit=100`)
        .then(r => { if (r.data.success) setStocks(r.data.data); })
        .catch(() => setStocks([]));
    } else {
      setStocks([]);
    }
  }, [form.buyer, isEdit]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  // Calculated
  const harga = parseFloat(form.hargaJual) || 0;
  const dpVal = parseFloat(form.dp) || 0;
  const pelunasanVal = parseFloat(form.pelunasan) || 0;
  const totalBayar = dpVal + pelunasanVal;
  const sisa = Math.max(0, harga - totalBayar);
  const profit = (parseFloat(form.hargaJual) || 0) - (parseFloat(form.hargaBeli) || 0);

  const validate = () => {
    const e = {};
    if (!form.buyer) e.buyer = 'Buyer wajib dipilih';
    if (!form.item.trim()) e.item = 'Nama item wajib diisi';
    if (!form.hargaJual || isNaN(form.hargaJual) || parseFloat(form.hargaJual) < 0) e.hargaJual = 'Harga jual tidak valid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity) || 1,
        hargaBeli: parseFloat(form.hargaBeli) || 0,
        hargaJual: parseFloat(form.hargaJual),
        dp: parseFloat(form.dp) || 0,
        fixPrice: parseFloat(form.fixPrice) || 0,
        pelunasan: parseFloat(form.pelunasan) || 0,
      };
      if (isEdit) {
        await api.put(`/orders/${order._id}`, payload);
        toast.success('Order berhasil diperbarui');
      } else {
        await api.post('/orders', payload);
        toast.success('Order berhasil ditambahkan');
      }
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan order';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? `Edit Order — ${order.orderId}` : 'Tambah Order Baru'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="X" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              {/* Buyer */}
              <div className="form-group">
                <label className="form-label required">Buyer</label>
                <select className={`form-control ${errors.buyer ? 'error' : ''}`} value={form.buyer} onChange={e => set('buyer', e.target.value)}>
                  <option value="">Pilih buyer...</option>
                  {buyers.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
                {errors.buyer && <div className="form-error">{errors.buyer}</div>}
              </div>
              {/* Item */}
              <div className="form-group">
                <label className="form-label required" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Nama Barang / Item</span>
                  {!isEdit && (
                    <button
                      type="button"
                      style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                      onClick={() => { setIsManualItem(v => !v); set('item', ''); }}
                    >
                      {isManualItem ? '← Pilih dari stok' : 'Ketik manual'}
                    </button>
                  )}
                </label>
                {!isEdit && !isManualItem ? (
                  <select
                    className={`form-control ${errors.item ? 'error' : ''}`}
                    value={form.item}
                    onChange={e => {
                      const selected = stocks.find(s => s.namaBarang === e.target.value);
                      set('item', e.target.value);
                      if (selected) {
                        set('hargaJual', selected.harga || '');
                        if (selected.warehouse) set('warehouse', selected.warehouse);
                      }
                    }}
                  >
                    <option value="">-- Pilih barang dari stok --</option>
                    {stocks.length === 0 && form.buyer && (
                      <option disabled value="">Tidak ada stok untuk buyer ini</option>
                    )}
                    {stocks.map(s => (
                      <option key={s._id} value={s.namaBarang}>
                        {s.namaBarang}{s.variant ? ` (${s.variant})` : ''} — Qty: {s.quantity} — {formatCurrency(s.harga)}/pcs
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`form-control ${errors.item ? 'error' : ''}`}
                    value={form.item}
                    onChange={e => set('item', e.target.value)}
                    placeholder="Nama barang"
                  />
                )}
                {errors.item && <div className="form-error">{errors.item}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-control" value={form.quantity} onChange={e => set('quantity', e.target.value)} min={1} />
              </div>
              <div className="form-group">
                <label className="form-label">Website / Marketplace</label>
                <input className="form-control" value={form.website} onChange={e => set('website', e.target.value)} placeholder="Shopee, Qoo10, dll" />
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Harga Beli (Modal)</label>
                <input type="number" className="form-control" value={form.hargaBeli} onChange={e => set('hargaBeli', e.target.value)} placeholder="0" min={0} />
                <div className="form-hint">Tidak ditampilkan ke buyer</div>
              </div>
              <div className="form-group">
                <label className="form-label required">Harga Jual</label>
                <input type="number" className={`form-control ${errors.hargaJual ? 'error' : ''}`} value={form.hargaJual} onChange={e => set('hargaJual', e.target.value)} placeholder="0" min={0} />
                {errors.hargaJual && <div className="form-error">{errors.hargaJual}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Fix Price</label>
                <input type="number" className="form-control" value={form.fixPrice} onChange={e => set('fixPrice', e.target.value)} placeholder="0" min={0} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">DP</label>
                <input type="number" className="form-control" value={form.dp} onChange={e => set('dp', e.target.value)} placeholder="0" min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">Pelunasan</label>
                <input type="number" className="form-control" value={form.pelunasan} onChange={e => set('pelunasan', e.target.value)} placeholder="0" min={0} />
              </div>
            </div>

            {/* Auto Calc */}
            {form.hargaJual && (
              <div style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Total Bayar</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>{formatCurrency(totalBayar)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Sisa Tagihan</div>
                  <div style={{ fontWeight: 700, color: sisa > 0 ? 'var(--danger)' : 'var(--success)', fontSize: 15 }}>{formatCurrency(sisa)}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Profit</div>
                  <div style={{ fontWeight: 700, color: profit >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}>{formatCurrency(profit)}</div>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Warehouse</label>
                <select className="form-control" value={form.warehouse} onChange={e => set('warehouse', e.target.value)}>
                  <option value="">Pilih warehouse...</option>
                  {WAREHOUSES.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nomor Resi</label>
                <input className="form-control" value={form.nomorResi} onChange={e => set('nomorResi', e.target.value)} placeholder="Nomor resi pengiriman" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status Barang</label>
                <select className="form-control" value={form.statusBarang} onChange={e => set('statusBarang', e.target.value)}>
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {isEdit && (
                <div className="form-group">
                  <label className="form-label">Catatan Perubahan Status</label>
                  <input className="form-control" value={form.statusNote} onChange={e => set('statusNote', e.target.value)} placeholder="Opsional" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Catatan</label>
              <textarea className="form-control" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan tambahan..." rows={3} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
