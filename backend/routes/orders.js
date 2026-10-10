const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getOrders, getOrder, createOrder, updateOrder, deleteOrder, bulkUpdateStatus
} = require('../controllers/orderController');

// All authenticated users can list/view (buyer sees only own)
router.get('/', authenticate, getOrders);

// Bulk actions BEFORE /:id routes to prevent route conflict
router.patch('/bulk-status', authenticate, authorize('seller'), bulkUpdateStatus);

// Single order routes
router.get('/:id', authenticate, getOrder);

// Seller only
router.post('/', authenticate, authorize('seller'), createOrder);
router.put('/:id', authenticate, authorize('seller'), updateOrder);
router.delete('/:id', authenticate, authorize('seller'), deleteOrder);

module.exports = router;
