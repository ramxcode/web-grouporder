import { useState, useEffect } from 'react';
import { formatCurrency, formatDate, STATUS_ORDER, getStatusBadgeClass, getPaymentBadgeClass } from '../../../lib/utils';
import { StatusBadge, PaymentBadge } from '../../../components/UI';
import Icon from '../../../components/Icon';
import api from '../../../lib/api';

export default function OrderDetail({ order: initialOrder, onClose, onEdit, isSeller = true }) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    // Refresh order detail
    api.get(`/orders/${initialOrder._id}`).then(r => {
      if (r.data.success) setOrder(r.data.data);
    }).catch(() => {});
  }, [initialOrder._id]);

  const statusHistory = order?.statusHistory || [];
  const currentIdx = STATUS_ORDER.indexOf(order?.statusBarang);

  const getTimelineIcon = (status, idx) => {
    if (idx < currentIdx) return <Icon name="Check" size={14} />;
    if (idx === currentIdx) return <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />;
    return <Icon name="Circle" size={12} />;
  };

  const getHistoryForStatus = (status) => {
    return [...statusHistory].reverse().find(h => h.status === status);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Detail Order</h3>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
              {order?.orderId}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onEdit && (
              <button className="btn btn-secondary btn-sm" onClick={onEdit}>
                <Icon name="Edit" size={14} /> Edit
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="X" size={18} /></button>
          </div>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left Column */}
            <div>
              {/* Order Info */}
              <div className="card mb-16" style={{ marginBottom: 16 }}>
                <div className="card-header" style={{ padding: '14px 20px' }}>
                  <div className="card-title" style={{ fontSize: 13 }}>📦 Informasi Order</div>
                </div>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <DetailRow label="Buyer" value={order?.buyer?.name} />
                    <DetailRow label="Item" value={order?.item} bold />
                    <DetailRow label="Quantity" value={order?.quantity} />
                    <DetailRow label="Website" value={order?.website || '-'} />
                    <DetailRow label="Tanggal Order" value={formatDate(order?.createdAt)} />
                    {order?.notes && <DetailRow label="Catatan" value={order.notes} />}
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="card">
                <div className="card-header" style={{ padding: '14px 20px' }}>
                  <div className="card-title" style={{ fontSize: 13 }}>💳 Informasi Pembayaran</div>
                  <PaymentBadge status={order?.paymentStatus} />
                </div>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <DetailRow label="Harga Jual" value={formatCurrency(order?.hargaJual)} bold />
                    {isSeller && <DetailRow label="Harga Beli" value={formatCurrency(order?.hargaBeli)} />}
                    {isSeller && (
                      <DetailRow
                        label="Profit"
                        value={formatCurrency(order?.profit)}
                        color={order?.profit >= 0 ? 'var(--success)' : 'var(--danger)'}
                        bold
                      />
                    )}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }} />
                    <DetailRow label="Fix Price" value={order?.fixPrice > 0 ? formatCurrency(order.fixPrice) : '-'} />
                    <DetailRow label="DP" value={formatCurrency(order?.dp)} />
                    <DetailRow label="Pelunasan" value={formatCurrency(order?.pelunasan)} />
                    <DetailRow label="Total Dibayar" value={formatCurrency(order?.totalPembayaran)} bold color="var(--success)" />
                    <DetailRow
                      label="Sisa Tagihan"
                      value={formatCurrency(order?.sisaTagihan)}
                      bold
                      color={order?.sisaTagihan > 0 ? 'var(--danger)' : 'var(--success)'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Shipping Info */}
              <div className="card mb-16" style={{ marginBottom: 16 }}>
                <div className="card-header" style={{ padding: '14px 20px' }}>
                  <div className="card-title" style={{ fontSize: 13 }}>🚚 Informasi Pengiriman</div>
                  <StatusBadge status={order?.statusBarang} />
                </div>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <DetailRow label="Warehouse" value={order?.warehouse || '-'} />
                    <DetailRow label="Nomor Resi" value={order?.nomorResi || '-'} mono />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="card">
                <div className="card-header" style={{ padding: '14px 20px' }}>
                  <div className="card-title" style={{ fontSize: 13 }}>📍 Tracking Status</div>
                </div>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div className="timeline">
                    {STATUS_ORDER.map((status, idx) => {
                      const isDone = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      const histEntry = getHistoryForStatus(status);
                      return (
                        <div key={status} className="timeline-item" style={{ paddingBottom: idx < STATUS_ORDER.length - 1 ? 16 : 0 }}>
                          <div className={`timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                            {getTimelineIcon(status, idx)}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-title" style={{
                              color: isDone || isCurrent ? 'var(--text)' : 'var(--text-muted)',
                              fontWeight: isCurrent ? 700 : 500,
                            }}>
                              {status}
                            </div>
                            {histEntry && (
                              <div className="timeline-time">{formatDate(histEntry.createdAt, true)}</div>
                            )}
                            {histEntry?.note && (
                              <div className="timeline-note">{histEntry.note}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold, color, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontWeight: bold ? 700 : 500,
        color: color || 'var(--text)',
        textAlign: 'right',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>
        {value ?? '-'}
      </span>
    </div>
  );
}
