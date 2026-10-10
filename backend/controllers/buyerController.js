const Buyer = require('../models/Buyer');
const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const createAuditLog = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

// GET /api/buyers - List all buyers
const getBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const query = {};
    // Seller isolation: seller only sees own buyers
    if (req.user.role === 'seller') {
      query.seller = req.user._id;
    }
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { whatsapp: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Buyer.countDocuments(query);
    const buyers = await Buyer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userAccount', 'email lastLogin isActive');

    res.json({
      success: true,
      data: buyers,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/buyers/:id - Get buyer detail
const getBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id).populate('userAccount', 'email lastLogin isActive');
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found.' });

    const orders = await Order.find({ buyer: buyer._id, isDeleted: false }).sort({ createdAt: -1 });
    const payments = await Payment.find({ buyer: buyer._id }).sort({ createdAt: -1 });
    const stocks = await Stock.find({ buyer: buyer._id });

    const totalBelanja = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
    const totalPembayaran = orders.reduce((s, o) => s + (o.totalPembayaran || 0), 0);
    const sisaTagihan = Math.max(0, totalBelanja - totalPembayaran);

    res.json({
      success: true,
      data: {
        buyer,
        orders,
        payments,
        stocks,
        summary: {
          totalOrder: orders.length,
          totalBelanja,
          totalPembayaran,
          sisaTagihan,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/buyers - Create buyer (seller only)
const createBuyer = async (req, res) => {
  try {
    const { name, whatsapp, email, address, notes, createAccount, password } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Buyer name is required.' });
    }

    // Check duplicate
    if (email) {
      const existing = await Buyer.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const buyer = await Buyer.create({ name, whatsapp, email, address, notes, seller: req.user._id });

    // Create user account if requested
    if (createAccount && (email || whatsapp) && password) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userAccount = await User.create({
        name,
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        password: hashedPassword,
        role: 'buyer',
        buyerRef: buyer._id,
      });

      buyer.userAccount = userAccount._id;
      await buyer.save();
    }

    await createAuditLog({
      action: 'CREATE',
      entity: 'Buyer',
      entityId: buyer._id,
      entityRef: buyer.name,
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Buyer ${buyer.name} created`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: buyer, message: 'Buyer created successfully.' });
  } catch (error) {
    console.error('Create buyer error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/buyers/:id - Update buyer
const updateBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found.' });

    const { name, whatsapp, email, address, notes, status } = req.body;
    const before = buyer.toObject();

    if (name) buyer.name = name;
    if (whatsapp !== undefined) buyer.whatsapp = whatsapp;
    if (email !== undefined) buyer.email = email;
    if (address !== undefined) buyer.address = address;
    if (notes !== undefined) buyer.notes = notes;
    if (status) buyer.status = status;

    await buyer.save();

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Buyer',
      entityId: buyer._id,
      entityRef: buyer.name,
      performedBy: req.user._id,
      performedByName: req.user.name,
      changes: { before, after: buyer.toObject() },
      description: `Buyer ${buyer.name} updated`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: buyer, message: 'Buyer updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/buyers/:id
const deleteBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found.' });

    const orderCount = await Order.countDocuments({ buyer: buyer._id, isDeleted: false });
    if (orderCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete buyer with ${orderCount} active orders.` });
    }

    await Buyer.findByIdAndDelete(req.params.id);

    await createAuditLog({
      action: 'DELETE',
      entity: 'Buyer',
      entityId: buyer._id,
      entityRef: buyer.name,
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Buyer ${buyer.name} deleted`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Buyer deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getBuyers, getBuyer, createBuyer, updateBuyer, deleteBuyer };
