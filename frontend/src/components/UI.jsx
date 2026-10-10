import { getStatusBadgeClass, getPaymentBadgeClass } from '../lib/utils';

// Generic status badge
export function StatusBadge({ status, type = 'status' }) {
  if (!status) return <span className="badge badge-gray">-</span>;
  const cls = type === 'payment' ? getPaymentBadgeClass(status) : getStatusBadgeClass(status);
  return <span className={`badge ${cls}`}>{status}</span>;
}

// Payment status badge
export function PaymentBadge({ status }) {
  if (!status) return null;
  const map = {
    'Unpaid': 'badge-danger',
    'DP': 'badge-warning',
    'Paid': 'badge-success',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

// Stock status badge
export function StockBadge({ status }) {
  if (!status) return null;
  const map = {
    'Available': 'badge-success',
    'Reserved': 'badge-warning',
    'Sold': 'badge-gray',
    'Waiting Arrival': 'badge-info',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

// Confirm dialog
export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading, confirmLabel = 'Hapus', confirmClass = 'btn-danger' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title || 'Konfirmasi'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {message || 'Apakah Anda yakin ingin melakukan tindakan ini?'}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Batal</button>
          <button className={`btn ${confirmClass}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Skeleton rows
export function SkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}>
              <div className="skeleton skeleton-text" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Empty state
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="empty-state-icon">
          {icon}
        </div>
      )}
      <h3>{title || 'Tidak ada data'}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

// Pagination component
export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages, total, limit } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const range = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="pagination">
      <span className="pagination-info">
        Menampilkan {start}–{end} dari {total} data
      </span>
      <div className="pagination-btns">
        <button
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          ‹
        </button>
        {page > 3 && (
          <>
            <button className="page-btn" onClick={() => onPageChange(1)}>1</button>
            {page > 4 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}
          </>
        )}
        {getPageNumbers().map(n => (
          <button
            key={n}
            className={`page-btn ${n === page ? 'active' : ''}`}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}
        {page < pages - 2 && (
          <>
            {page < pages - 3 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}
            <button className="page-btn" onClick={() => onPageChange(pages)}>{pages}</button>
          </>
        )}
        <button
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
        >
          ›
        </button>
      </div>
    </div>
  );
}

// Stat card
export function StatCard({ label, value, icon, color = 'var(--primary)', bg = 'var(--primary-bg)', desc }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );
}
