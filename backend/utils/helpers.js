const Buyer = require('../models/Buyer');
const Order = require('../models/Order');

const updateBuyerSummary = async (buyerId) => {
  try {
    const orders = await Order.find({ buyer: buyerId, isDeleted: false });
    const totalOrders = orders.length;
    const totalTagihan = orders.reduce((sum, o) => sum + (o.hargaJual || 0), 0);
    const totalPembayaran = orders.reduce((sum, o) => sum + (o.totalPembayaran || 0), 0);
    const sisaTagihan = Math.max(0, totalTagihan - totalPembayaran);

    await Buyer.findByIdAndUpdate(buyerId, {
      totalOrders,
      totalTagihan,
      totalPembayaran,
      sisaTagihan,
    });
  } catch (err) {
    console.error('updateBuyerSummary error:', err.message);
  }
};

const generateOrderId = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const prefix = `GO-${dateStr}-`;
  const Order = require('../models/Order');

  // Find last order of today
  const lastOrder = await Order.findOne({
    orderId: { $regex: `^${prefix}` },
  }).sort({ orderId: -1 });

  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderId.split('-')[2], 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

module.exports = { updateBuyerSummary, generateOrderId, formatCurrency };
