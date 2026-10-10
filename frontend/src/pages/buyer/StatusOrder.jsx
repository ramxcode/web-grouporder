import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { StatusBadge, PaymentBadge, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDateShort, STATUS_ORDER, getStatusBadgeClass } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { ShoppingBag, Search, Eye, Check, Circle } from 'lucide-react';
import OrderDetail from '../seller/components/OrderDetail';

export default function BuyerStatusOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 10, search,
        ...(filterPayment && { paymentStatus: filterPayment }),
        ...(filterStatus && { statusBarang: filterStatus }),
      });
      const res = await api.get(`/orders?${params}`);
      if (res.data.success) { setOrders(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat pesanan'); }
    finally { setLoading(false); }
  }, [page, search, filterPayment, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Mini timeline for each order card
  const MiniTimeline = ({ statusBarang }) => {
    const currentIdx = STATUS_ORDER.indexOf(statusBarang);
    // Show only up to 5 key statuses
    const keyStatuses = ['Ordered', 'WH KR', 'Arrived INA', 'Arrived Admin', 'Done CO'];
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
        {keyStatuses.map((s, i) => {
          const sIdx = STATUS_ORDER.indexOf(s);
          const isDone = sIdx <= currentIdx;
          const isCurrent = s === statusBarang || (currentIdx >= STATUS_ORDER.indexOf('WH KR') && currentIdx <= STATUS_ORDER.indexOf('WH US') && s === 'WH KR');
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 'var(--radius-full)',
                background: isDone ? 'var(--success-light)' : 'var(--bg)',
                border: `1px solid ${isDone ? 'var(--success)' : 'var(--border)'}`,
                fontSize: 11, fontWeight: 600,
                color: isDone ? 'var(--success-dark)' : 'var(--text-muted)',
              }}>
                {isDone ? <Check size={10} /> : <Circle size={10} />}
                {s}
              </div>
              {i < keyStatuses.length - 1 && (
                <div style={{ width: 16, height: 2, background: isDone && i < currentIdx ? 'var(--success)' : 'var(--border)', borderRadius: 2 }} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout title="Status Order" subtitle="Pantau perjalanan pesanan Anda">
      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <div className="search-input-wrap">
          <Search size={15} />
          <input type="text" className="search-input" placeholder="Cari order, nama barang..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={filterPayment} onChange={e => { setFilterPayment(e.target.value); setPage(1); }}>
          <option value="">Semua Pembayaran</option>
          <option value="Unpaid">Unpaid</option>
          <option value="DP">DP</option>
          <option value="Paid">Paid</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">Semua Status</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 10 }} />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="skeleton skeleton-text" style={{ width: '30%' }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag size={32} />} title="Belum ada pesanan" message="Pesanan Anda akan muncul di sini" />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map(o => (
            <div key={o._id} className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--primary)', fontWeight: 800 }}>{o.orderId}</span>
                    <PaymentBadge status={o.paymentStatus} />
                    <StatusBadge status={o.statusBarang} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{o.item}</div>
                  {o.quantity > 1 && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>Qty: {o.quantity}</div>}

                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Harga</div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{formatCurrency(o.hargaJual)}</div>
                    </div>
                    {o.dp > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DP</div>
                        <div style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(o.dp)}</div>
                      </div>
                    )}
                    {o.sisaTagihan > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sisa Tagihan</div>
                        <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(o.sisaTagihan)}</div>
                      </div>
                    )}
                    {o.nomorResi && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>No. Resi</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{o.nomorResi}</div>
                      </div>
                    )}
                  </div>

                  {/* Mini Timeline */}
                  <MiniTimeline statusBarang={o.statusBarang} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateShort(o.createdAt)}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => setDetailOrder(o)}>
                    <Eye size={13} /> Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && (
        <div style={{ marginTop: 16 }}>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {detailOrder && (
        <OrderDetail
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          isSeller={false}
        />
      )}
    </Layout>
  );
}
