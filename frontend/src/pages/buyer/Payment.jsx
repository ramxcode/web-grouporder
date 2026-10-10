import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDateShort, formatDate } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CreditCard, AlertCircle } from 'lucide-react';

export default function BuyerPayment() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payments?page=${page}&limit=15`);
      if (res.data.success) { setPayments(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat pembayaran'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => {
    api.get('/orders?limit=100').then(r => { if (r.data.success) setOrders(r.data.data); });
  }, []);

  // Group payments by order
  const orderSummaries = orders.map(o => ({
    ...o,
    payments: payments.filter(p => p.order?._id === o._id || p.order === o._id),
  }));

  const totalTagihan = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
  const totalBayar = orders.reduce((s, o) => s + (o.totalPembayaran || 0), 0);
  const totalSisa = Math.max(0, totalTagihan - totalBayar);

  return (
    <Layout title="Payment" subtitle="Riwayat dan status pembayaran pesanan Anda">
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ '--stat-color': 'var(--primary)' }}>
          <div className="stat-label">Total Tagihan</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{formatCurrency(totalTagihan)}</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--success)' }}>
          <div className="stat-label">Sudah Dibayar</div>
          <div className="stat-value" style={{ fontSize: 16, color: 'var(--success)' }}>{formatCurrency(totalBayar)}</div>
        </div>
        <div className="stat-card" style={{ '--stat-color': 'var(--danger)' }}>
          <div className="stat-label">Sisa Tagihan</div>
          <div className="stat-value" style={{ fontSize: 16, color: 'var(--danger)' }}>{formatCurrency(totalSisa)}</div>
        </div>
      </div>

      {/* Per-order payment status */}
      {orders.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Status Per Order</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {orders.map(o => (
              <div key={o._id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}>{o.orderId}</span>
                      <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-success' : o.paymentStatus === 'DP' ? 'badge-warning' : 'badge-danger'}`}>
                        {o.paymentStatus}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{o.item}</div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {[
                        { l: 'Total Tagihan', v: formatCurrency(o.hargaJual), c: 'var(--text)' },
                        { l: 'DP', v: formatCurrency(o.dp), c: 'var(--text)' },
                        { l: 'Pelunasan', v: formatCurrency(o.pelunasan), c: 'var(--text)' },
                        { l: 'Total Dibayar', v: formatCurrency(o.totalPembayaran), c: 'var(--success)' },
                        { l: 'Sisa', v: formatCurrency(o.sisaTagihan), c: o.sisaTagihan > 0 ? 'var(--danger)' : 'var(--success)' },
                      ].map(item => (
                        <div key={item.l}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{item.l}</div>
                          <div style={{ fontWeight: 700, color: item.c }}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {o.sisaTagihan > 0 && (
                    <div style={{
                      padding: '12px 16px', background: '#fee2e2', borderRadius: 'var(--radius)',
                      display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)',
                      fontSize: 12.5, fontWeight: 600, flexShrink: 0,
                    }}>
                      <AlertCircle size={14} />
                      Belum Lunas
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Riwayat Pembayaran</div>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>
        ) : payments.length === 0 ? (
          <EmptyState icon={<CreditCard size={32} />} title="Belum ada riwayat pembayaran" message="Pembayaran yang dikonfirmasi akan muncul di sini" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Order</th>
                  <th>Nominal</th>
                  <th>Tipe</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDateShort(p.tanggal)}</td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>{p.order?.orderId}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.order?.item?.slice(0, 20)}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>{formatCurrency(p.amount)}</td>
                    <td><span className="badge badge-info">{p.type}</span></td>
                    <td style={{ fontSize: 13 }}>{p.method}</td>
                    <td><span className={`badge ${p.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </Layout>
  );
}
