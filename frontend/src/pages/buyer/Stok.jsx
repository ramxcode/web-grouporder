import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { StockBadge, EmptyState, Pagination } from '../../components/UI';
import { formatCurrency, formatDateShort } from '../../lib/utils';
import api from '../../lib/api';
import Icon from '../../components/Icon';

export default function BuyerStok() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stocks?page=${page}&limit=12`);
      if (res.data.success) { setStocks(res.data.data); setPagination(res.data.pagination); }
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Layout title="Stok Barang Saya" subtitle="Barang yang telah menjadi milik Anda">
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius)', marginBottom: 12 }} />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            </div>
          ))}
        </div>
      ) : stocks.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Icon name="Package" size={48} />} title="Belum ada barang" message="Barang yang sudah assigned ke Anda akan muncul di sini" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            {stocks.map(s => (
              <div key={s._id} className="card" style={{ overflow: 'hidden' }}>
                {/* Photo */}
                <div style={{ height: 160, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {s.foto ? (
                    <img src={s.foto} alt={s.namaBarang} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon name="Package" size={48} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>{s.namaBarang}</div>
                  {s.variant && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>{s.variant}</div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Qty</div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{s.quantity}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Harga</div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{formatCurrency(s.harga)}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <StockBadge status={s.status} />
                  </div>

                  {s.warehouse && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      📦 {s.warehouse}
                    </div>
                  )}
                  {s.tanggalMasuk && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Masuk: {formatDateShort(s.tanggalMasuk)}
                    </div>
                  )}
                  {s.notes && (
                    <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {s.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </>
      )}
    </Layout>
  );
}
