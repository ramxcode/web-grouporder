const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  entity: {
    type: String,
    enum: ['Order', 'Buyer', 'Payment', 'Stock', 'User', 'Seller', 'Settings', 'WebsiteSettings', 'Admin'],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    // Not required — some audit log entries reference non-ObjectId entities
  },
  entityRef: {
    type: String, // Human readable reference like order ID or seller ID
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  performedByName: {
    type: String,
  },
  performedByRole: {
    type: String,
    enum: ['super_admin', 'seller', 'buyer'],
  },
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
  },
  description: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ entity: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
