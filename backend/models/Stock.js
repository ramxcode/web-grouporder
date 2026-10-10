const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  // Multi-tenancy
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  namaBarang: {
    type: String,
    required: [true, 'Nama barang is required'],
    trim: true,
  },
  variant: {
    type: String,
    trim: true,
    default: '',
  },
  foto: {
    type: String,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },
  harga: {
    type: Number,
    default: 0,
    min: 0,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    default: null,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  warehouse: {
    type: String,
    enum: ['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Indonesia', 'Custom', ''],
    default: '',
  },
  customWarehouse: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['Available', 'Reserved', 'Sold', 'Waiting Arrival'],
    default: 'Waiting Arrival',
  },
  tanggalMasuk: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Stock', stockSchema);
