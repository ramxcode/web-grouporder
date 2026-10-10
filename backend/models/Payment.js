const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Multi-tenancy
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0,
  },
  type: {
    type: String,
    enum: ['DP', 'Pelunasan', 'Partial', 'Full'],
    required: true,
  },
  method: {
    type: String,
    enum: ['QRIS', 'Bank Transfer', 'E-Wallet', 'Cash', 'Lainnya'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Rejected'],
    default: 'Confirmed',
  },
  tanggal: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    trim: true,
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
