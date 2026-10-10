const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const { updateBuyerSummary } = require('../utils/helpers');
const createAuditLog = require('../utils/auditLogger');
const createNotification = require('../utils/notificationHelper');

// GET /api/payments - List payments
const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, buyerId, orderId, status, startDate, endDate, search = '' } = req.query;
    const query = {};

    if (req.user.role === 'buyer') {
      query.buyer = req.user.buyerRef;
    } else if (buyerId) {
      query.buyer = buyerId;
    }

    if (orderId) query.order = orderId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.tanggal = {};
      if (startDate) query.tanggal.$gte = new Date(startDate);
      if (endDate) query.tanggal.$lte = new Date(endDate + 'T23:59:59');
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('buyer', 'name whatsapp')
      .populate('order', 'orderId item hargaJual')
      .populate('confirmedBy', 'name')
      .sort({ tanggal: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: payments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/payments/:id
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('buyer', 'name whatsapp')
      .populate('order', 'orderId item hargaJual dp pelunasan sisaTagihan paymentStatus');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    if (req.user.role === 'buyer') {
      if (payment.buyer._id.toString() !== req.user.buyerRef?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/payments - Create payment record (seller only)
const createPayment = async (req, res) => {
  try {
    const { orderId, buyerId, amount, type, method, tanggal, notes } = req.body;

    if (!orderId || !buyerId || !amount || !type || !method) {
      return res.status(400).json({ success: false, message: 'orderId, buyerId, amount, type, and method are required.' });
    }

    const order = await Order.findById(orderId);
    if (!order || order.isDeleted) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found.' });

    const payment = await Payment.create({
      seller: req.user._id,
      order: orderId,
      buyer: buyerId,
      amount,
      type,
      method,
      tanggal: tanggal ? new Date(tanggal) : new Date(),
      notes,
      status: 'Confirmed',
      confirmedBy: req.user._id,
    });

    // Update order payment fields
    if (type === 'DP' || type === 'Partial') {
      order.dp = (order.dp || 0) + amount;
    } else if (type === 'Pelunasan' || type === 'Full') {
      order.pelunasan = (order.pelunasan || 0) + amount;
    }
    await order.save();
    await updateBuyerSummary(buyerId);

    await createAuditLog({
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment._id,
      entityRef: order.orderId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Payment Rp${amount.toLocaleString('id-ID')} (${type}) for order ${order.orderId}`,
      ipAddress: req.ip,
    });

    // Notify buyer
    if (buyer.userAccount) {
      const isPaid = order.paymentStatus === 'Paid';
      await createNotification({
        recipient: buyer.userAccount,
        recipientRole: 'buyer',
        title: isPaid ? 'Pembayaran Lunas' : 'Pembayaran Dikonfirmasi',
        message: `Pembayaran Rp${amount.toLocaleString('id-ID')} untuk order ${order.orderId} telah dikonfirmasi.`,
        type: isPaid ? 'payment_paid' : 'payment_confirmed',
        relatedOrder: order._id,
        relatedPayment: payment._id,
      });
    }

    const populated = await Payment.findById(payment._id)
      .populate('buyer', 'name')
      .populate('order', 'orderId item');

    res.status(201).json({ success: true, data: populated, message: 'Payment recorded successfully.' });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/payments/:id - Update payment (seller only)
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    const { amount, type, method, tanggal, notes, status } = req.body;
    const before = payment.toObject();

    // Reverse previous payment effect on order
    const order = await Order.findById(payment.order);
    if (order) {
      if (payment.type === 'DP' || payment.type === 'Partial') {
        order.dp = Math.max(0, (order.dp || 0) - payment.amount);
      } else {
        order.pelunasan = Math.max(0, (order.pelunasan || 0) - payment.amount);
      }

      const newAmount = amount !== undefined ? amount : payment.amount;
      const newType = type || payment.type;

      if (newType === 'DP' || newType === 'Partial') {
        order.dp = (order.dp || 0) + newAmount;
      } else {
        order.pelunasan = (order.pelunasan || 0) + newAmount;
      }
      await order.save();
      await updateBuyerSummary(order.buyer);
    }

    if (amount !== undefined) payment.amount = amount;
    if (type) payment.type = type;
    if (method) payment.method = method;
    if (tanggal) payment.tanggal = new Date(tanggal);
    if (notes !== undefined) payment.notes = notes;
    if (status) payment.status = status;
    await payment.save();

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Payment',
      entityId: payment._id,
      entityRef: payment._id.toString(),
      performedBy: req.user._id,
      performedByName: req.user.name,
      changes: { before, after: payment.toObject() },
      description: 'Payment updated',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: payment, message: 'Payment updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    // Reverse payment effect on order
    const order = await Order.findById(payment.order);
    if (order) {
      if (payment.type === 'DP' || payment.type === 'Partial') {
        order.dp = Math.max(0, (order.dp || 0) - payment.amount);
      } else {
        order.pelunasan = Math.max(0, (order.pelunasan || 0) - payment.amount);
      }
      await order.save();
      await updateBuyerSummary(order.buyer);
    }

    await Payment.findByIdAndDelete(req.params.id);

    await createAuditLog({
      action: 'DELETE',
      entity: 'Payment',
      entityId: payment._id,
      entityRef: payment._id.toString(),
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Payment Rp${payment.amount.toLocaleString('id-ID')} deleted`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Payment deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getPayments, getPayment, createPayment, updatePayment, deletePayment };
