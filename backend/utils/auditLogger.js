const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 * @param {Object} opts
 * @param {string} opts.action - Action performed (CREATE|UPDATE|DELETE|LOGIN|LOGOUT)
 * @param {string} opts.entity - Entity type (Seller|Order|Buyer|Payment|Settings|etc.)
 * @param {string} [opts.entityRef] - Human-readable entity reference (e.g., SELLER-0001)
 * @param {*} [opts.entityId] - MongoDB ObjectId of entity
 * @param {*} opts.performedBy - User ID who performed the action
 * @param {string} opts.performedByName - Name of the user
 * @param {string} [opts.performedByRole] - Role of the user
 * @param {string} [opts.description] - Human-readable description
 * @param {Object} [opts.changes] - { before, after } for update actions
 * @param {string} [opts.ipAddress] - IP address
 * @param {string} [opts.userAgent] - User agent string
 */
const createAuditLog = async ({
  action,
  entity,
  entityId,
  entityRef,
  performedBy,
  performedByName,
  performedByRole,
  changes,
  description,
  ipAddress,
  userAgent,
}) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      entityRef,
      performedBy,
      performedByName,
      performedByRole,
      changes,
      description,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = createAuditLog;
