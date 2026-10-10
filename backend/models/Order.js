const mongoose = require('mongoose');

const STATUSES = ['Ordered', 'WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Arrived INA', 'Arrived Admin', 'Done CO'];
const PAYMENT_STATUSES = ['Unpaid', 'DP', 'Paid'];
const WAREHOUSES = ['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Indonesia', 'Custom'];

const statusHistorySchema = new mongoose.Schema({
  status: { type: String },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: { type: String },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  // Multi-tenancy: which seller owns this order
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: [true, 'Buyer is required'],
  },
  item: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  website: {
    type: String,
    trim: true,
  },
  // Pricing
  hargaBeli: {
    type: Number,
    default: 0,
  },
  hargaJual: {
    type: Number,
    required: [true, 'Harga jual is required'],
    min: 0,
  },
  dp: {
    type: Number,
    default: 0,
    min: 0,
  },
  fixPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  pelunasan: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Payment
  totalPembayaran: {
    type: Number,
    default: 0,
  },
  sisaTagihan: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'Unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['QRIS', 'Bank Transfer', 'E-Wallet', 'Cash', 'Lainnya', ''],
    default: '',
  },
  // Shipping
  warehouse: {
    type: String,
    enum: [...WAREHOUSES, ''],
    default: '',
  },
  nomorResi: {
    type: String,
    trim: true,
    default: '',
  },
  // Status
  statusBarang: {
    type: String,
    enum: STATUSES,
    default: 'Ordered',
  },
  statusHistory: [statusHistorySchema],
  // Meta
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  profit: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Auto-calculate profit and payment info
orderSchema.pre('save', async function () {
  this.profit = (this.hargaJual || 0) - (this.hargaBeli || 0);
  this.totalPembayaran = (this.dp || 0) + (this.pelunasan || 0);
  this.sisaTagihan = Math.max(0, (this.hargaJual || 0) - this.totalPembayaran);

  if (this.sisaTagihan === 0 && this.totalPembayaran > 0) {
    this.paymentStatus = 'Paid';
  } else if (this.totalPembayaran > 0) {
    this.paymentStatus = 'DP';
  } else {
    this.paymentStatus = 'Unpaid';
  }
});


module.exports = mongoose.model('Order', orderSchema);
module.exports.STATUSES = STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports.WAREHOUSES = WAREHOUSES;
