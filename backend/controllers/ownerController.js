const User = require('../models/User');
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const AuditLog = require('../models/AuditLog');
const WebsiteSettings = require('../models/WebsiteSettings');
const createAuditLog = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

// ----------- Helper -----------
const generateSellerId = async () => {
  const lastSeller = await Seller.findOne().sort({ createdAt: -1 });
  let num = 1;
  if (lastSeller?.sellerId) {
    const n = parseInt(lastSeller.sellerId.split('-')[1] || '0', 10);
    num = n + 1;
  }
  return `SELLER-${String(num).padStart(4, '0')}`;
};

const updateSellerStats = async (sellerId) => {
  const seller = await Seller.findById(sellerId);
  if (!seller) return;
  const sellerUserId = seller.user;
  const [buyers, orders] = await Promise.all([
    Buyer.countDocuments({ seller: sellerUserId }),
    Order.find({ seller: sellerUserId, isDeleted: false }),
  ]);
  seller.totalBuyer = buyers;
  seller.totalOrder = orders.length;
  seller.totalTransaksi = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
  seller.totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);
  await seller.save();
};

// ----------- Dashboard -----------
const getOwnerDashboard = async (req, res) => {
  try {
    const [
      totalSeller, activeSellers, suspendedSellers,
      totalBuyer, orders, payments, stocks,
    ] = await Promise.all([
      Seller.countDocuments({ isDeleted: false }),
      Seller.countDocuments({ status: 'active', isDeleted: false }),
      Seller.countDocuments({ status: 'suspended', isDeleted: false }),
      Buyer.countDocuments(),
      Order.find({ isDeleted: false }).populate('seller', 'name email').populate('buyer', 'name'),
      Payment.find({ status: 'Confirmed' }).populate('seller', 'name').populate('buyer', 'name').populate('order', 'orderId item').sort({ createdAt: -1 }).limit(10),
      Stock.countDocuments(),
    ]);

    const totalOrder = orders.length;
    const totalNilaiTransaksi = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
    const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);
    const totalOrderAktif = orders.filter(o => o.statusBarang !== 'Done CO').length;
    const totalOrderSelesai = orders.filter(o => o.statusBarang === 'Done CO').length;

    const recentSellers = await Seller.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(5).populate('user', 'name email lastLogin');
    const recentOrders = orders.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);

    // Status distribution
    const STATUSES = ['Ordered', 'WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Arrived INA', 'Arrived Admin', 'Done CO'];
    const statusCounts = {};
    STATUSES.forEach(s => { statusCounts[s] = 0; });
    orders.forEach(o => { if (statusCounts[o.statusBarang] !== undefined) statusCounts[o.statusBarang]++; });

    // Per-seller stats
    const sellers = await Seller.find({ isDeleted: false }).populate('user', 'name email');
    const sellerPerformance = await Promise.all(sellers.map(async s => {
      const sOrders = orders.filter(o => o.seller?._id?.toString() === s.user?._id?.toString());
      return {
        sellerId: s.sellerId,
        name: s.user?.name,
        namaGO: s.namaGO,
        totalOrder: sOrders.length,
        totalTransaksi: sOrders.reduce((acc, o) => acc + (o.hargaJual || 0), 0),
        totalProfit: sOrders.reduce((acc, o) => acc + (o.profit || 0), 0),
        status: s.status,
      };
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalSeller, activeSellers, suspendedSellers,
          totalBuyer, totalOrder, totalNilaiTransaksi,
          totalProfit, totalOrderAktif, totalOrderSelesai,
          totalStock: stocks,
          totalPayment: payments.length,
        },
        statusCounts,
        recentSellers,
        recentOrders,
        recentPayments: payments,
        sellerPerformance,
      },
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Seller CRUD -----------
const getSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status } = req.query;
    const query = { isDeleted: false };
    if (status) query.status = status;

    const sellers = await Seller.find(query)
      .populate('user', 'name email whatsapp username lastLogin isActive')
      .sort({ createdAt: -1 });

    // Filter by search on user data
    let filtered = sellers;
    if (search) {
      const s = search.toLowerCase();
      filtered = sellers.filter(sel =>
        sel.user?.name?.toLowerCase().includes(s) ||
        sel.user?.email?.toLowerCase().includes(s) ||
        sel.namaGO?.toLowerCase().includes(s) ||
        sel.sellerId?.toLowerCase().includes(s)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: paginated,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSeller = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).populate('user', 'name email whatsapp username lastLogin isActive createdAt loginHistory');
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const sellerUserId = seller.user._id;

    const [buyers, orders, payments, stocks, auditLogs] = await Promise.all([
      Buyer.find({ seller: sellerUserId }).limit(50),
      Order.find({ seller: sellerUserId, isDeleted: false }).populate('buyer', 'name').sort({ createdAt: -1 }).limit(50),
      Payment.find({ seller: sellerUserId }).populate('buyer', 'name').populate('order', 'orderId item').sort({ createdAt: -1 }).limit(50),
      Stock.find({ seller: sellerUserId }).populate('buyer', 'name').limit(50),
      AuditLog.find({ performedBy: sellerUserId }).sort({ createdAt: -1 }).limit(30),
    ]);

    const totalTransaksi = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
    const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);
    const totalPembayaran = payments.reduce((s, p) => s + (p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        seller,
        buyers,
        orders,
        payments,
        stocks,
        auditLogs,
        summary: {
          totalBuyer: buyers.length,
          totalOrder: orders.length,
          totalPayment: payments.length,
          totalStock: stocks.length,
          totalTransaksi,
          totalProfit,
          totalPembayaran,
          totalOrderAktif: orders.filter(o => o.statusBarang !== 'Done CO').length,
          totalOrderSelesai: orders.filter(o => o.statusBarang === 'Done CO').length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createSeller = async (req, res) => {
  try {
    const { name, namaGO, username, email, whatsapp, password, notes, status = 'active' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Email sudah digunakan.' });

    if (username) {
      const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
      if (existingUser) return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
    }

    const sellerId = await generateSellerId();

    const user = await User.create({
      name, username: username?.toLowerCase().trim(),
      email: email.toLowerCase().trim(), whatsapp, password, role: 'seller', isActive: true,
    });

    const seller = await Seller.create({ sellerId, user: user._id, namaGO: namaGO || name, email: email.toLowerCase(), whatsapp, notes, status });

    await createAuditLog({
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      action: 'CREATE',
      entity: 'Seller',
      entityRef: sellerId,
      description: `Super Admin membuat Seller baru: ${name} (${sellerId})`,
    });

    res.status(201).json({ success: true, message: 'Seller berhasil dibuat.', data: { seller, user } });
  } catch (error) {
    console.error('Create seller error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

const updateSeller = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const { name, namaGO, username, email, whatsapp, status, notes } = req.body;
    const oldStatus = seller.status;

    if (namaGO !== undefined) seller.namaGO = namaGO;
    if (status !== undefined) seller.status = status;
    if (notes !== undefined) seller.notes = notes;
    if (whatsapp !== undefined) seller.whatsapp = whatsapp;
    await seller.save();

    // Update user
    const updateUser = {};
    if (name) updateUser.name = name;
    if (email) updateUser.email = email.toLowerCase();
    if (whatsapp) updateUser.whatsapp = whatsapp;
    if (username) updateUser.username = username.toLowerCase().trim();
    if (status === 'active') updateUser.isActive = true;
    if (status === 'suspended' || status === 'disabled') updateUser.isActive = false;
    await User.findByIdAndUpdate(seller.user, updateUser);

    await createAuditLog({
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      action: 'UPDATE',
      entity: 'Seller',
      entityRef: seller.sellerId,
      description: `Super Admin mengubah Seller ${seller.sellerId}. Status: ${oldStatus} → ${status || oldStatus}`,
      changes: { before: { status: oldStatus }, after: { status: status || oldStatus } },
    });

    res.json({ success: true, message: 'Seller diperbarui.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const suspendSeller = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });
    const { action } = req.body; // 'suspend' | 'activate' | 'disable'
    const statusMap = { suspend: 'suspended', activate: 'active', disable: 'disabled' };
    const newStatus = statusMap[action] || 'suspended';
    const oldStatus = seller.status;
    seller.status = newStatus;
    await seller.save();
    await User.findByIdAndUpdate(seller.user, { isActive: newStatus === 'active' });

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, action: 'UPDATE',
      entity: 'Seller', entityRef: seller.sellerId,
      description: `Super Admin mengubah status Seller ${seller.sellerId}: ${oldStatus} → ${newStatus}`,
    });

    res.json({ success: true, message: `Seller status diubah ke ${newStatus}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const resetSellerPassword = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });

    const user = await User.findById(seller.user);
    user.password = newPassword;
    await user.save();

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, action: 'UPDATE',
      entity: 'Seller', entityRef: seller.sellerId,
      description: `Super Admin mereset password Seller ${seller.sellerId}`,
    });

    res.json({ success: true, message: 'Password Seller berhasil direset.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteSeller = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    seller.isDeleted = true;
    seller.deletedAt = new Date();
    seller.status = 'disabled';
    await seller.save();
    await User.findByIdAndUpdate(seller.user, { isActive: false });

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, action: 'DELETE',
      entity: 'Seller', entityRef: seller.sellerId,
      description: `Super Admin menghapus (soft delete) Seller ${seller.sellerId}`,
    });

    res.json({ success: true, message: 'Seller dihapus (soft delete).' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Global Views -----------
const getAllBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sellerId } = req.query;
    const query = {};
    if (sellerId) query.seller = sellerId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { whatsapp: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Buyer.countDocuments(query);
    const buyers = await Buyer.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: buyers, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sellerId, paymentStatus, statusBarang } = req.query;
    const query = { isDeleted: false };
    if (sellerId) query.seller = sellerId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (statusBarang) query.statusBarang = statusBarang;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { item: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('seller', 'name email')
      .populate('buyer', 'name whatsapp')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: orders, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, sellerId, status } = req.query;
    const query = {};
    if (sellerId) query.seller = sellerId;
    if (status) query.status = status;
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('seller', 'name')
      .populate('buyer', 'name')
      .populate('order', 'orderId item')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: payments, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getAllStocks = async (req, res) => {
  try {
    const { page = 1, limit = 20, sellerId } = req.query;
    const query = {};
    if (sellerId) query.seller = sellerId;
    const total = await Stock.countDocuments(query);
    const stocks = await Stock.find(query)
      .populate('seller', 'name')
      .populate('buyer', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: stocks, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Website Settings -----------
const getWebsiteSettings = async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne({ singleton: true });
    if (!settings) settings = await WebsiteSettings.create({ singleton: true });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateWebsiteSettings = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Handle file uploads
    if (req.files) {
      if (req.files.logo) updates.logo = `/uploads/${req.files.logo[0].filename}`;
      if (req.files.logoDark) updates.logoDark = `/uploads/${req.files.logoDark[0].filename}`;
      if (req.files.favicon) updates.favicon = `/uploads/${req.files.favicon[0].filename}`;
      if (req.files.globalQris) updates.globalQris = `/uploads/${req.files.globalQris[0].filename}`;
    }

    // Parse JSON arrays
    if (typeof updates.globalBankAccounts === 'string') {
      try { updates.globalBankAccounts = JSON.parse(updates.globalBankAccounts); } catch {}
    }
    if (typeof updates.globalEwallets === 'string') {
      try { updates.globalEwallets = JSON.parse(updates.globalEwallets); } catch {}
    }

    const settings = await WebsiteSettings.findOneAndUpdate(
      { singleton: true },
      updates,
      { new: true, upsert: true }
    );

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, action: 'UPDATE',
      entity: 'Settings', entityRef: 'website-settings',
      description: `Super Admin mengubah Website Settings`,
    });

    res.json({ success: true, message: 'Website settings diperbarui.', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Reports -----------
const getOwnerReports = async (req, res) => {
  try {
    const { startDate, endDate, sellerId } = req.query;
    const query = { isDeleted: false };
    if (sellerId) query.seller = sellerId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }

    const orders = await Order.find(query).populate('seller', 'name namaGO');
    const payments = await Payment.find({ status: 'Confirmed', ...(sellerId && { seller: sellerId }) });

    const sellers = await Seller.find({ isDeleted: false }).populate('user', 'name');

    const sellerComparison = await Promise.all(sellers.map(async s => {
      const sOrders = orders.filter(o => o.seller?._id?.toString() === s.user?._id?.toString());
      return {
        sellerId: s.sellerId,
        name: s.user?.name,
        namaGO: s.namaGO,
        totalOrder: sOrders.length,
        totalTransaksi: sOrders.reduce((acc, o) => acc + (o.hargaJual || 0), 0),
        totalProfit: sOrders.reduce((acc, o) => acc + (o.profit || 0), 0),
        totalBuyer: s.totalBuyer,
      };
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalOrder: orders.length,
          totalTransaksi: orders.reduce((s, o) => s + (o.hargaJual || 0), 0),
          totalProfit: orders.reduce((s, o) => s + (o.profit || 0), 0),
          totalOrderSelesai: orders.filter(o => o.statusBarang === 'Done CO').length,
          totalOrderAktif: orders.filter(o => o.statusBarang !== 'Done CO').length,
          totalPayment: payments.reduce((s, p) => s + (p.amount || 0), 0),
        },
        sellerComparison: sellerComparison.sort((a, b) => b.totalTransaksi - a.totalTransaksi),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Audit Logs (Super Admin view) -----------
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, entity, action, search } = req.query;
    const query = {};
    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { performedByName: { $regex: search, $options: 'i' } },
        { entityRef: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Admin Management -----------
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'super_admin' }).select('-password -loginHistory').sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { name, username, email, whatsapp, password } = req.body;
    if (!name || !password) return res.status(400).json({ success: false, message: 'Nama dan password wajib diisi.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password minimal 8 karakter.' });

    // Check uniqueness
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) return res.status(400).json({ success: false, message: 'Email sudah digunakan.' });
    }
    if (username) {
      const existing = await User.findOne({ username: username.toLowerCase().trim() });
      if (existing) return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
    }

    const admin = await User.create({
      name, username: username?.toLowerCase().trim(), email: email?.toLowerCase().trim(),
      whatsapp, password, role: 'super_admin', isActive: true,
    });

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role,
      action: 'CREATE', entity: 'Admin', entityRef: admin._id.toString(),
      description: `Super Admin membuat akun admin baru: ${name}`,
    });

    res.status(201).json({ success: true, message: 'Admin berhasil dibuat.', data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'super_admin') return res.status(404).json({ success: false, message: 'Admin not found.' });

    const { name, username, email, whatsapp, isActive } = req.body;
    if (name) admin.name = name;
    if (username) admin.username = username.toLowerCase().trim();
    if (email) admin.email = email.toLowerCase().trim();
    if (whatsapp !== undefined) admin.whatsapp = whatsapp;
    if (isActive !== undefined) admin.isActive = isActive;
    await admin.save();

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role,
      action: 'UPDATE', entity: 'Admin', entityRef: admin._id.toString(),
      description: `Super Admin mengupdate akun admin: ${admin.name}`,
    });

    res.json({ success: true, message: 'Admin diperbarui.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    // Prevent deleting self
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri.' });
    }
    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'super_admin') return res.status(404).json({ success: false, message: 'Admin not found.' });

    await admin.deleteOne();

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role,
      action: 'DELETE', entity: 'Admin', entityRef: req.params.id,
      description: `Super Admin menghapus akun admin: ${admin.name}`,
    });

    res.json({ success: true, message: 'Admin dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Owner Profile -----------
const getOwnerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').lean();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateOwnerProfile = async (req, res) => {
  try {
    const { name, username, email, whatsapp, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (username) user.username = username.toLowerCase().trim();
    if (email) user.email = email.toLowerCase().trim();
    if (whatsapp !== undefined) user.whatsapp = whatsapp;

    // Password change
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ success: false, message: 'Password saat ini wajib diisi.' });
      if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter.' });
      const match = await user.comparePassword(currentPassword);
      if (!match) return res.status(400).json({ success: false, message: 'Password saat ini tidak sesuai.' });
      user.password = newPassword;
    }

    // Avatar
    if (req.file) user.avatar = `/uploads/${req.file.filename}`;

    await user.save();

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role,
      action: 'UPDATE', entity: 'User', entityRef: req.user._id.toString(),
      description: `Super Admin mengupdate profil: ${user.name}`,
    });

    res.json({ success: true, message: 'Profil diperbarui.', data: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Restore Seller -----------
const restoreSeller = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    seller.isDeleted = false;
    seller.deletedAt = null;
    seller.status = 'active';
    await seller.save();
    await User.findByIdAndUpdate(seller.user, { isActive: true });

    await createAuditLog({
      performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role,
      action: 'UPDATE', entity: 'Seller', entityRef: seller.sellerId,
      description: `Super Admin merestore Seller ${seller.sellerId}`,
    });

    res.json({ success: true, message: 'Seller berhasil direstore.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------- Deleted Sellers (Trash) -----------
const getDeletedSellers = async (req, res) => {
  try {
    const sellers = await Seller.find({ isDeleted: true })
      .populate('user', 'name email whatsapp lastLogin')
      .sort({ deletedAt: -1 });
    res.json({ success: true, data: sellers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getOwnerDashboard, getSellers, getSeller, createSeller, updateSeller,
  suspendSeller, resetSellerPassword, deleteSeller,
  getAllBuyers, getAllOrders, getAllPayments, getAllStocks,
  getWebsiteSettings, updateWebsiteSettings, getOwnerReports,
  getAuditLogs,
  getAdmins, createAdmin, updateAdmin, deleteAdmin,
  getOwnerProfile, updateOwnerProfile,
  restoreSeller, getDeletedSellers,
};
