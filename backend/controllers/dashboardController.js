const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// GET /api/dashboard/seller - Seller dashboard summary
const getSellerDashboard = async (req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false }).populate('buyer', 'name');
    const buyers = await Buyer.find();
    const stocks = await Stock.find();
    const payments = await Payment.find({ status: 'Confirmed' });

    // Summary cards
    const totalOrder = orders.length;
    const totalBuyer = buyers.length;
    const totalBarang = stocks.length;
    const totalStok = stocks.reduce((s, st) => s + st.quantity, 0);
    const totalTagihan = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
    const totalDP = orders.reduce((s, o) => s + (o.dp || 0), 0);
    const totalPelunasan = orders.reduce((s, o) => s + (o.pelunasan || 0), 0);
    const totalBelumDibayar = orders.reduce((s, o) => s + (o.sisaTagihan || 0), 0);
    const totalOrderSelesai = orders.filter(o => o.statusBarang === 'Done CO').length;
    const totalProfit = orders.reduce((s, o) => s + (o.profit || 0), 0);

    // Status distribution
    const statusCounts = {};
    const STATUSES = ['Ordered', 'WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Arrived INA', 'Arrived Admin', 'Done CO'];
    STATUSES.forEach(s => { statusCounts[s] = 0; });
    orders.forEach(o => {
      if (statusCounts[o.statusBarang] !== undefined) {
        statusCounts[o.statusBarang]++;
      }
    });

    // Recent orders
    const recentOrders = await Order.find({ isDeleted: false })
      .populate('buyer', 'name whatsapp')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent payments
    const recentPayments = await Payment.find({ status: 'Confirmed' })
      .populate('buyer', 'name')
      .populate('order', 'orderId item')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          totalOrder,
          totalBuyer,
          totalBarang,
          totalStok,
          totalTagihan,
          totalDP,
          totalPelunasan,
          totalBelumDibayar,
          totalOrderSelesai,
          totalProfit,
        },
        statusCounts,
        recentOrders,
        recentPayments,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/dashboard/buyer - Buyer dashboard summary
const getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.user.buyerRef;
    if (!buyerId) {
      return res.status(400).json({ success: false, message: 'Buyer profile not linked.' });
    }

    const orders = await Order.find({ buyer: buyerId, isDeleted: false });
    const stocks = await Stock.find({ buyer: buyerId });

    const totalOrder = orders.length;
    const activeOrders = orders.filter(o => o.statusBarang !== 'Done CO').length;
    const menungguPembayaran = orders.filter(o => o.paymentStatus !== 'Paid').length;
    const totalTagihan = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
    const sudahDibayar = orders.reduce((s, o) => s + (o.totalPembayaran || 0), 0);
    const sisaTagihan = Math.max(0, totalTagihan - sudahDibayar);
    const barangDiWarehouse = orders.filter(o =>
      ['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US'].includes(o.statusBarang)
    ).length;
    const barangArrived = orders.filter(o =>
      ['Arrived INA', 'Arrived Admin'].includes(o.statusBarang)
    ).length;
    const orderSelesai = orders.filter(o => o.statusBarang === 'Done CO').length;

    res.json({
      success: true,
      data: {
        summary: {
          totalOrder,
          activeOrders,
          menungguPembayaran,
          totalTagihan,
          sudahDibayar,
          sisaTagihan,
          barangDiWarehouse,
          barangArrived,
          orderSelesai,
        },
        recentOrders: orders.slice(-5).reverse(),
      },
    });
  } catch (error) {
    console.error('Buyer dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getSellerDashboard, getBuyerDashboard };
