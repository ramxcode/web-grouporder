const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');
const XLSX = require('xlsx');

const exportToExcel = (data, sheetName) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

// GET /api/export/orders
const exportOrders = async (req, res) => {
  try {
    const { buyerId, startDate, endDate, statusBarang, paymentStatus } = req.query;
    const query = { isDeleted: false };

    if (buyerId) query.buyer = buyerId;
    if (statusBarang) query.statusBarang = statusBarang;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }

    const orders = await Order.find(query)
      .populate('buyer', 'name whatsapp email')
      .sort({ createdAt: -1 });

    const data = orders.map((o, i) => ({
      No: i + 1,
      'Order ID': o.orderId,
      'Nama Buyer': o.buyer?.name || '',
      'WhatsApp': o.buyer?.whatsapp || '',
      'Item': o.item,
      'Quantity': o.quantity,
      'Website': o.website || '',
      'Harga Beli': o.hargaBeli,
      'Harga Jual': o.hargaJual,
      'Profit': o.profit,
      'DP': o.dp,
      'Pelunasan': o.pelunasan,
      'Total Pembayaran': o.totalPembayaran,
      'Sisa Tagihan': o.sisaTagihan,
      'Status Pembayaran': o.paymentStatus,
      'Warehouse': o.warehouse || '',
      'Nomor Resi': o.nomorResi || '',
      'Status Barang': o.statusBarang,
      'Catatan': o.notes || '',
      'Tanggal Order': new Date(o.createdAt).toLocaleDateString('id-ID'),
    }));

    const format = req.query.format || 'xlsx';
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      return res.send(csv);
    }

    const buffer = exportToExcel(data, 'Orders');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

// GET /api/export/buyers
const exportBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find().sort({ name: 1 });
    const data = buyers.map((b, i) => ({
      No: i + 1,
      'Nama Buyer': b.name,
      'WhatsApp': b.whatsapp || '',
      'Email': b.email || '',
      'Total Order': b.totalOrders,
      'Total Tagihan': b.totalTagihan,
      'Total Pembayaran': b.totalPembayaran,
      'Sisa Tagihan': b.sisaTagihan,
      'Status': b.status,
      'Tanggal Bergabung': new Date(b.createdAt).toLocaleDateString('id-ID'),
    }));

    const format = req.query.format || 'xlsx';
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=buyers.csv');
      return res.send(csv);
    }

    const buffer = exportToExcel(data, 'Buyers');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=buyers.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

// GET /api/export/payments
const exportPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('buyer', 'name')
      .populate('order', 'orderId item')
      .sort({ tanggal: -1 });

    const data = payments.map((p, i) => ({
      No: i + 1,
      'Nama Buyer': p.buyer?.name || '',
      'Order ID': p.order?.orderId || '',
      'Item': p.order?.item || '',
      'Jumlah': p.amount,
      'Tipe': p.type,
      'Metode': p.method,
      'Status': p.status,
      'Tanggal': new Date(p.tanggal).toLocaleDateString('id-ID'),
      'Catatan': p.notes || '',
    }));

    const format = req.query.format || 'xlsx';
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
      return res.send(csv);
    }

    const buffer = exportToExcel(data, 'Payments');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

// GET /api/export/stocks
const exportStocks = async (req, res) => {
  try {
    const stocks = await Stock.find()
      .populate('buyer', 'name')
      .populate('order', 'orderId')
      .sort({ createdAt: -1 });

    const data = stocks.map((s, i) => ({
      No: i + 1,
      'Nama Barang': s.namaBarang,
      'Variant': s.variant || '',
      'Quantity': s.quantity,
      'Harga': s.harga,
      'Buyer': s.buyer?.name || '',
      'Warehouse': s.warehouse || '',
      'Status': s.status,
      'Tanggal Masuk': s.tanggalMasuk ? new Date(s.tanggalMasuk).toLocaleDateString('id-ID') : '',
      'Catatan': s.notes || '',
    }));

    const format = req.query.format || 'xlsx';
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stocks.csv');
      return res.send(csv);
    }

    const buffer = exportToExcel(data, 'Stocks');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stocks.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

module.exports = { exportOrders, exportBuyers, exportPayments, exportStocks };
