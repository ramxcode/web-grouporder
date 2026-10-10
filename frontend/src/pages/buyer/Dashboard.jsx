import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { StatCard } from '../../components/UI';
import { formatCurrency, formatDateShort, getStatusBadgeClass } from '../../lib/utils';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingBag, CreditCard, Package, CheckCircle, Clock, AlertCircle, Warehouse, Plane } from 'lucide-react';

export default function BuyerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { buyerProfile, user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/buyer').then(r => {
      if (r.data.success) setData(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const s = data?.summary || {};

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Selamat datang!">
        <div className="stats-grid">
          {Array.from({ length: 9 }).map((_, i) => (
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
    <Layout title={`Halo, ${user?.name}! 👋`} subtitle="Dashboard pesanan dan pembayaran Anda">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 24,
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Selamat datang kembali!</h2>
        <p style={{ fontSize: 13.5, opacity: 0.85 }}>
          Anda memiliki <strong>{s.totalOrder || 0}</strong> pesanan dan sisa tagihan{' '}
          <strong>{formatCurrency(s.sisaTagihan)}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        <StatCard label="Total Order" value={s.totalOrder || 0} icon={<ShoppingBag size={22} />} color="var(--primary)" bg="var(--primary-bg)" />
        <StatCard label="Order Aktif" value={s.activeOrders || 0} icon={<Clock size={22} />} color="#0ea5e9" bg="#f0f9ff" />
        <StatCard label="Menunggu Bayar" value={s.menungguPembayaran || 0} icon={<AlertCircle size={22} />} color="#f59e0b" bg="#fef3c7" />
        <StatCard label="Total Tagihan" value={formatCurrency(s.totalTagihan)} icon={<CreditCard size={22} />} color="#8b5cf6" bg="#f5f3ff" />
        <StatCard label="Sudah Dibayar" value={formatCurrency(s.sudahDibayar)} icon={<CheckCircle size={22} />} color="#10b981" bg="#d1fae5" />
        <StatCard label="Sisa Tagihan" value={formatCurrency(s.sisaTagihan)} icon={<AlertCircle size={22} />} color="#ef4444" bg="#fee2e2" />
        <StatCard label="Di Warehouse" value={s.barangDiWarehouse || 0} icon={<Warehouse size={22} />} color="#14b8a6" bg="#f0fdfa" />
        <StatCard label="Arrived INA" value={s.barangArrived || 0} icon={<Plane size={22} />} color="#22c55e" bg="#f0fdf4" />
        <StatCard label="Order Selesai" value={s.orderSelesai || 0} icon={<CheckCircle size={22} />} color="#15803d" bg="#dcfce7" />
      </div>

      {/* Recent Orders */}
      <div className="card mt-24">
        <div className="card-header">
          <div className="card-title">Pesanan Terbaru</div>
          <a href="/buyer/status-order" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}>
            Lihat Semua →
          </a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Item</th>
                <th>Harga</th>
                <th>Status Bayar</th>
                <th>Status Barang</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Belum ada pesanan</td></tr>
              ) : data?.recentOrders?.map(o => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}>{o.orderId}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{o.item}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(o.hargaJual)}</td>
                  <td>
                    <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-success' : o.paymentStatus === 'DP' ? 'badge-warning' : 'badge-danger'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td><span className={`badge ${getStatusBadgeClass(o.statusBarang)}`}>{o.statusBarang}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
