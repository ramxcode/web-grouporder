const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs - List audit logs (seller only)
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, entity, action, search = '' } = req.query;
    const query = {};

    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { entityRef: { $regex: search, $options: 'i' } },
        { performedByName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAuditLogs };
