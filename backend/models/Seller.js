const mongoose = require('mongoose');

// Extended seller user model - embeds seller-specific info
const sellerSchema = new mongoose.Schema({
  sellerId: {
    type: String,
    unique: true,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  namaGO: {
    type: String,
    default: '',
    trim: true,
  },
  whatsapp: {
    type: String,
    default: '',
    trim: true,
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'disabled'],
    default: 'active',
  },
  notes: {
    type: String,
    default: '',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  // Aggregated stats (updated periodically)
  totalBuyer: { type: Number, default: 0 },
  totalOrder: { type: Number, default: 0 },
  totalTransaksi: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Seller', sellerSchema);
