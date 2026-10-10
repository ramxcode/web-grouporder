const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema({
  // Multi-tenancy: which seller this buyer belongs to
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true,
  },
  whatsapp: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  userAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Computed summary (updated on order changes)
  totalOrders: { type: Number, default: 0 },
  totalTagihan: { type: Number, default: 0 },
  totalPembayaran: { type: Number, default: 0 },
  sisaTagihan: { type: Number, default: 0 },
}, {
  timestamps: true,
});

buyerSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'buyer',
});

module.exports = mongoose.model('Buyer', buyerSchema);
