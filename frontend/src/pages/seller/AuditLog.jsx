import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { SkeletonRows, EmptyState, Pagination } from '../../components/UI';
import { formatDate, formatDateShort } from '../../lib/utils';
import api from '../../lib/api';
import { FileText, Search } from 'lucide-react';

const ACTION_COLORS = {
  CREATE: 'badge-success',
  UPDATE: 'badge-info',
  DELETE: 'badge-danger',
  BULK_UPDATE: 'badge-warning',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 30, search, ...(filterEntity && { entity: filterEntity }) });
        const res = await api.get(`/audit-logs?${params}`);
        if (res.data.success) { setLogs(res.data.data); setPagination(res.data.pagination); }
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [page, search, filterEntity]);

  return (
    <Layout title="Activity Log" subtitle="Riwayat seluruh perubahan data">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Activity Log</div>
        </div>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="search-input-wrap">
              <Search size={15} />
              <input type="text" className="search-input" placeholder="Cari aktivitas..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="filter-select" value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1); }}>
              <option value="">Semua Entitas</option>
              {['Order', 'Buyer', 'Payment', 'Stock', 'Settings'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div>
          {loading ? (
            <div style={{ padding: 16 }}><SkeletonRows rows={8} cols={5} /></div>
          ) : logs.length === 0 ? (
            <EmptyState icon={<FileText size={32} />} title="Belum ada aktivitas" message="Log aktivitas akan muncul di sini" />
          ) : logs.map(log => (
            <div key={log._id} style={{
              padding: '14px 24px', borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'flex-start', gap: 16,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: log.action === 'CREATE' ? '#d1fae5' : log.action === 'DELETE' ? '#fee2e2' : '#dbeafe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                {log.action === 'CREATE' ? '➕' : log.action === 'DELETE' ? '🗑️' : '✏️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`badge ${ACTION_COLORS[log.action] || 'badge-gray'}`}>{log.action}</span>
                  <span className="badge badge-gray">{log.entity}</span>
                  {log.entityRef && (
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', fontWeight: 700 }}>
                      {log.entityRef}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4 }}>{log.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {log.performedByName && <span>oleh <strong>{log.performedByName}</strong> · </span>}
                  {formatDate(log.createdAt, true)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {pagination && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>
    </Layout>
  );
}
