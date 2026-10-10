const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getPayments, getPayment, createPayment, updatePayment, deletePayment } = require('../controllers/paymentController');

router.get('/', authenticate, getPayments);
router.get('/:id', authenticate, getPayment);
router.post('/', authenticate, authorize('seller'), createPayment);
router.put('/:id', authenticate, authorize('seller'), updatePayment);
router.delete('/:id', authenticate, authorize('seller'), deletePayment);

module.exports = router;
