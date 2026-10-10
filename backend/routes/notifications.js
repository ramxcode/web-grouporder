const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');

router.get('/', authenticate, getNotifications);
// read-all BEFORE /:id/read to avoid route conflict
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markRead);
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;
