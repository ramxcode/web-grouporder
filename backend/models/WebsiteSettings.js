const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema({
  // Branding
  siteName: { type: String, default: 'WEB REKAPAN GO' },
  shortName: { type: String, default: 'REKAPAN GO' },
  tagline: { type: String, default: 'Kelola Group Order Jadi Lebih Mudah' },
  description: { type: String, default: '' },
  logo: { type: String, default: null },
  logoDark: { type: String, default: null },
  favicon: { type: String, default: null },
  footerText: { type: String, default: '© 2026 Zastiply - Made By RAMXCODE' },
  developerLink: { type: String, default: 'https://t.me/minramz' },
  developerName: { type: String, default: 'RAMXCODE' },

  // Theme
  primaryColor: { type: String, default: '#6366f1' },
  secondaryColor: { type: String, default: '#8b5cf6' },
  accentColor: { type: String, default: '#06b6d4' },
  sidebarColor: { type: String, default: '#1e1b4b' },
  backgroundColor: { type: String, default: '#f8fafc' },
  borderRadius: { type: String, default: '10px' },
  themeMode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },

  // General Config
  defaultCurrency: { type: String, default: 'IDR' },
  timezone: { type: String, default: 'Asia/Jakarta' },
  dateFormat: { type: String, default: 'DD MMMM YYYY' },
  defaultPagination: { type: Number, default: 20 },
  sessionTimeout: { type: Number, default: 10080 }, // minutes (7 days)
  buyerRegistration: { type: Boolean, default: false },
  notificationEnabled: { type: Boolean, default: true },
  invoicePrefix: { type: String, default: 'INV' },
  orderPrefix: { type: String, default: 'GO' },
  sellerPrefix: { type: String, default: 'SELLER' },

  // Maintenance
  maintenanceMode: { type: Boolean, default: false },
  maintenanceTitle: { type: String, default: 'Sedang Maintenance' },
  maintenanceMessage: { type: String, default: 'Website sedang dalam perbaikan. Silakan coba beberapa saat lagi.' },
  maintenanceEstimation: { type: Date, default: null },

  // Contact
  contactEmail: { type: String, default: '' },
  contactWhatsapp: { type: String, default: '' },
  contactInstagram: { type: String, default: '' },
  contactTiktok: { type: String, default: '' },
  contactTelegram: { type: String, default: '' },
  contactAddress: { type: String, default: '' },
  contactCsLink: { type: String, default: '' },

  // Payment Config
  allowSellerCustomPayment: { type: Boolean, default: true },

  // Global payment methods
  globalBankAccounts: [{
    bankName: String,
    accountNumber: String,
    accountName: String,
    isActive: { type: Boolean, default: true },
  }],
  globalQris: { type: String, default: null },
  globalQrisMerchantName: { type: String, default: '' },
  globalEwallets: [{
    name: String,
    number: String,
    isActive: { type: Boolean, default: true },
  }],

  // Singleton
  singleton: { type: Boolean, default: true, unique: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
