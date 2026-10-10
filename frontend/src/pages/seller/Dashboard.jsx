import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { StatCard } from '../../components/UI';
import { formatCurrency, formatDateShort, getStatusBadgeClass, getPaymentBadgeClass } from '../../lib/utils';
import api from '../../lib/api';
import {
  ShoppingBag, Users, Package, TrendingUp, CreditCard, DollarSign,
  AlertCircle, CheckCircle, Layers, BarChart3,
} from 'lucide-react';

const STATUS_COLORS = {
  'Ordered': '#0369a1',
  'WH KR': '#92400e',
  'WH JP': '#991b1b',
  'WH Taiwan': '#6d28d9',
  'WH Thai': '#86198f',
  'WH US': '#1e40af',
  'Arrived INA': '#065f46',
  'Arrived Admin': '#047857',
  'Done CO': '#15803d',
};

const STATUS_BG = {
  'Ordered': '#f0f9ff',
  'WH KR': '#fef3c7',
  'WH JP': '#fee2e2',
  'WH Taiwan': '#f5f3ff',
  'WH Thai': '#fdf4ff',
  'WH US': '#dbeafe',
  'Arrived INA': '#d1fae5',
  'Arrived Admin': '#ecfdf5',
  'Done CO': '#f0fdf4',
};

export default function SellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard/seller');
        if (res.data.success) setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const s = data?.summary || {};
  const statusCounts = data?.statusCounts || {};

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Overview semua aktivitas GO">
        <div className="stats-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="skeleton" style={{ height: 28, width: '80%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" subtitle="Overview semua aktivitas Group Order">
      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        <StatCard label="Total Order" value={s.totalOrder || 0} icon={<ShoppingBag size={22} />} color="var(--primary)" bg="var(--primary-bg)" />
        <StatCard label="Total Buyer" value={s.totalBuyer || 0} icon={<Users size={22} />} color="#8b5cf6" bg="#f5f3ff" />
        <StatCard label="Total Barang" value={s.totalBarang || 0} icon={<Package size={22} />} color="#0ea5e9" bg="#f0f9ff" />
        <StatCard label="Total Stok" value={s.totalStok || 0} icon={<Layers size={22} />} color="#14b8a6" bg="#f0fdfa" />
        <StatCard label="Total Tagihan" value={formatCurrency(s.totalTagihan)} icon={<CreditCard size={22} />} color="#f59e0b" bg="#fef3c7" />
        <StatCard label="Total DP Masuk" value={formatCurrency(s.totalDP)} icon={<DollarSign size={22} />} color="#10b981" bg="#d1fae5" />
        <StatCard label="Total Pelunasan" value={formatCurrency(s.totalPelunasan)} icon={<CheckCircle size={22} />} color="#22c55e" bg="#f0fdf4" />
        <StatCard label="Belum Dibayar" value={formatCurrency(s.totalBelumDibayar)} icon={<AlertCircle size={22} />} color="#ef4444" bg="#fee2e2" />
        <StatCard label="Order Selesai" value={s.totalOrderSelesai || 0} icon={<CheckCircle size={22} />} color="#15803d" bg="#dcfce7" />
        <StatCard label="Total Profit" value={formatCurrency(s.totalProfit)} icon={<TrendingUp size={22} />} color="#7c3aed" bg="#f5f3ff" />
      </div>

      {/* Status Distribution */}
      <div className="card mb-24">
        <div className="card-header">
          <div>
            <div className="card-title">Distribusi Status Barang</div>
            <div className="card-subtitle">Ringkasan posisi seluruh order saat ini</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  background: STATUS_BG[status] || 'var(--bg)',
                  border: `1px solid ${STATUS_COLORS[status]}30`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[status], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {status}
                </span>
                <span style={{ fontSize: 28, fontWeight: 800, color: STATUS_COLORS[status], lineHeight: 1 }}>
                  {count}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>order</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Order Terbaru</div>
            <a href="/seller/status-order" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}>
              Lihat Semua →
            </a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Buyer</th>
                  <th>Harga</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders?.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Belum ada order</td></tr>
                ) : (
                  data?.recentOrders?.map(o => (
                    <tr key={o._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--primary)' }}>{o.orderId}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.item?.slice(0, 20)}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{o.buyer?.name}</td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(o.hargaJual)}</td>
                      <td><span className={`badge ${getStatusBadgeClass(o.statusBarang)}`}>{o.statusBarang}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Pembayaran Terbaru</div>
            <a href="/seller/payment" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}>
              Lihat Semua →
            </a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Nominal</th>
                  <th>Metode</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentPayments?.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Belum ada pembayaran</td></tr>
                ) : (
                  data?.recentPayments?.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontSize: 13 }}>{p.buyer?.name}</td>
                      <td style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                      <td><span className="badge badge-info">{p.method}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateShort(p.tanggal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
