const Notification = require('../models/Notification');

const createNotification = async ({
  recipient,
  recipientRole,
  title,
  message,
  type = 'general',
  relatedOrder = null,
  relatedPayment = null,
}) => {
  try {
    await Notification.create({
      recipient,
      recipientRole,
      title,
      message,
      type,
      relatedOrder,
      relatedPayment,
    });
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

module.exports = createNotification;
