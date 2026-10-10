const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSellerDashboard, getBuyerDashboard } = require('../controllers/dashboardController');

router.get('/seller', authenticate, authorize('seller'), getSellerDashboard);
router.get('/buyer', authenticate, authorize('buyer'), getBuyerDashboard);

module.exports = router;
