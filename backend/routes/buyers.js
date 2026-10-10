const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getBuyers, getBuyer, createBuyer, updateBuyer, deleteBuyer } = require('../controllers/buyerController');

router.get('/', authenticate, authorize('seller'), getBuyers);
router.get('/:id', authenticate, authorize('seller'), getBuyer);
router.post('/', authenticate, authorize('seller'), createBuyer);
router.put('/:id', authenticate, authorize('seller'), updateBuyer);
router.delete('/:id', authenticate, authorize('seller'), deleteBuyer);

module.exports = router;
