const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  namaGroupOrder: {
    type: String,
    default: 'WEB REKAPAN GO',
  },
  logo: {
    type: String,
    default: null,
  },
  whatsapp: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  // Payment info
  rekeningBank: [{
    bankName: String,
    accountNumber: String,
    accountName: String,
  }],
  qrisImage: {
    type: String,
    default: null,
  },
  defaultWarehouse: {
    type: String,
    enum: ['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US', 'Indonesia', 'Custom', ''],
    default: '',
  },
  // Single settings document
  singleton: {
    type: Boolean,
    default: true,
    unique: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Settings', settingsSchema);
