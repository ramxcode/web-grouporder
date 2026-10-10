import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';

const ENTITIES = ['', 'Order', 'Buyer', 'Payment', 'Stock', 'Seller', 'User', 'Settings', 'WebsiteSettings', 'Admin'];
const ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

const entityColor = {
  Order: { bg: '#dbeafe', color: '#1d4ed8' },
  Seller: { bg: '#ede9fe', color: '#7c3aed' },
  Buyer: { bg: '#d1fae5', color: '#065f46' },
  Payment: { bg: '#fef3c7', color: '#92400e' },
  Stock: { bg: '#fce7f3', color: '#9d174d' },
  Settings: { bg: '#f3f4f6', color: '#374151' },
  WebsiteSettings: { bg: '#e0e7ff', color: '#4338ca' },
  Admin: { bg: '#fef9c3', color: '#713f12' },
  User: { bg: '#f0fdf4', color: '#15803d' },
};

const actionColor = {
  CREATE: { bg: '#d1fae5', color: '#065f46' },
  UPDATE: { bg: '#dbeafe', color: '#1d4ed8' },
  DELETE: { bg: '#fee2e2', color: '#991b1b' },
  LOGIN: { bg: '#f3e8ff', color: '#7e22ce' },
  LOGOUT: { bg: '#f3f4f6', color: '#374151' },
};

const Badge = ({ label, map }) => {
  const cfg = map?.[label] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      padding: '0.2rem 0.65rem', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 700,
      color: cfg.color, background: cfg.bg,
    }}>{label || '—'}</span>
  );
};

export default function OwnerAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (search) params.search = search;
      if (entity) params.entity = entity;
      if (action) params.action = action;
      const r = await api.get('/owner/audit-logs', { params });
      setLogs(r.data.data);
      setPagination(r.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, entity, action]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Audit Log" subtitle="Seluruh aktivitas sistem WEB REKAPAN GO">
      {/* Filters */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="form-input"
            style={{ flex: '1', minWidth: '220px' }}
            placeholder="Cari deskripsi, nama, ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="form-select" style={{ width: '160px' }} value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}>
            <option value="">Semua Entity</option>
            {ENTITIES.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select className="form-select" style={{ width: '140px' }} value={action} onChange={e => { setAction(e.target.value); setPage(1); }}>
            <option value="">Semua Action</option>
            {ACTIONS.filter(Boolean).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setEntity(''); setAction(''); setPage(1); }}>
            Reset
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh">
            🔄 Refresh
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Total: {pagination.total || 0} log
          </span>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? <div className="loading-spinner" style={{ margin: '3rem auto' }} /> : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Dilakukan Oleh</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Referensi</th>
                  <th>Deskripsi</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr key={log._id} style={{ cursor: log.changes ? 'pointer' : 'default' }}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.performedByName || '—'}
                        </div>
                        {log.performedByRole && (
                          <div style={{ fontSize: '0.72rem', color: log.performedByRole === 'super_admin' ? '#a78bfa' : 'var(--text-muted)' }}>
                            {log.performedByRole === 'super_admin' ? '👑 Super Admin' : log.performedByRole === 'seller' ? '🏪 Seller' : '👤 Buyer'}
                          </div>
                        )}
                      </td>
                      <td><Badge label={log.action} map={actionColor} /></td>
                      <td><Badge label={log.entity} map={entityColor} /></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {log.entityRef || '—'}
                      </td>
                      <td style={{ fontSize: '0.83rem', maxWidth: '340px', color: 'var(--text-secondary)' }}>
                        {log.description || '—'}
                      </td>
                      <td>
                        {log.changes && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                          >
                            {expandedLog === log._id ? 'Tutup' : 'Detail'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedLog === log._id && log.changes && (
                      <tr key={`${log._id}-detail`}>
                        <td colSpan={7} style={{ padding: '0 1rem 1rem', background: 'var(--bg-tertiary)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {log.changes.before && (
                              <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ef4444' }}>SEBELUM</p>
                                <pre style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', overflow: 'auto', maxHeight: '200px', color: 'var(--text-secondary)' }}>
                                  {JSON.stringify(log.changes.before, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.changes.after && (
                              <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: '#10b981' }}>SESUDAH</p>
                                <pre style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', overflow: 'auto', maxHeight: '200px', color: 'var(--text-secondary)' }}>
                                  {JSON.stringify(log.changes.after, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                          {log.ipAddress && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                              IP: {log.ipAddress} {log.userAgent && `| UA: ${log.userAgent.slice(0, 80)}...`}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    Tidak ada log ditemukan
                  </td></tr>
                )}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1rem' }}>
                <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Hal {page} / {pagination.pages} ({pagination.total} log)
                </span>
                <button className="btn btn-sm btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
