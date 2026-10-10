const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getOwnerDashboard, getSellers, getSeller, createSeller, updateSeller,
  suspendSeller, resetSellerPassword, deleteSeller, restoreSeller, getDeletedSellers,
  getAllBuyers, getAllOrders, getAllPayments, getAllStocks,
  getWebsiteSettings, updateWebsiteSettings, getOwnerReports,
  getAuditLogs,
  getAdmins, createAdmin, updateAdmin, deleteAdmin,
  getOwnerProfile, updateOwnerProfile,
} = require('../controllers/ownerController');

// All routes require super_admin role
const superAdminOnly = [authenticate, authorize('super_admin')];

// File upload for settings
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Dashboard
router.get('/dashboard', ...superAdminOnly, getOwnerDashboard);

// Seller Management
router.get('/sellers', ...superAdminOnly, getSellers);
router.post('/sellers', ...superAdminOnly, createSeller);
router.get('/sellers/deleted', ...superAdminOnly, getDeletedSellers);
router.get('/sellers/:id', ...superAdminOnly, getSeller);
router.put('/sellers/:id', ...superAdminOnly, updateSeller);
router.patch('/sellers/:id/status', ...superAdminOnly, suspendSeller);
router.patch('/sellers/:id/reset-password', ...superAdminOnly, resetSellerPassword);
router.patch('/sellers/:id/restore', ...superAdminOnly, restoreSeller);
router.delete('/sellers/:id', ...superAdminOnly, deleteSeller);

// Global views
router.get('/buyers', ...superAdminOnly, getAllBuyers);
router.get('/orders', ...superAdminOnly, getAllOrders);
router.get('/payments', ...superAdminOnly, getAllPayments);
router.get('/stocks', ...superAdminOnly, getAllStocks);

// Website Settings - GET is fully public for branding
router.get('/website-settings', getWebsiteSettings);
router.put('/website-settings', ...superAdminOnly, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'logoDark', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'globalQris', maxCount: 1 },
]), updateWebsiteSettings);

// Reports
router.get('/reports', ...superAdminOnly, getOwnerReports);

// Audit Logs (full system view)
router.get('/audit-logs', ...superAdminOnly, getAuditLogs);

// Admin Management
router.get('/admins', ...superAdminOnly, getAdmins);
router.post('/admins', ...superAdminOnly, createAdmin);
router.put('/admins/:id', ...superAdminOnly, updateAdmin);
router.delete('/admins/:id', ...superAdminOnly, deleteAdmin);

// Owner Profile
router.get('/profile', ...superAdminOnly, getOwnerProfile);
router.put('/profile', ...superAdminOnly, upload.single('avatar'), updateOwnerProfile);

module.exports = router;
