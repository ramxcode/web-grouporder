const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { getAuditLogs } = require('../controllers/auditLogController');
const { exportOrders, exportBuyers, exportPayments, exportStocks } = require('../controllers/exportController');

// Settings
const settingsUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, authorize('seller'), settingsUpload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'qris', maxCount: 1 },
]), updateSettings);

// Audit logs (seller only)
router.get('/audit-logs', authenticate, authorize('seller'), getAuditLogs);

// Export (seller only)
router.get('/export/orders', authenticate, authorize('seller'), exportOrders);
router.get('/export/buyers', authenticate, authorize('seller'), exportBuyers);
router.get('/export/payments', authenticate, authorize('seller'), exportPayments);
router.get('/export/stocks', authenticate, authorize('seller'), exportStocks);

module.exports = router;
