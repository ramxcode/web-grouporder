const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  username: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  whatsapp: {
    type: String,
    sparse: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['super_admin', 'seller', 'buyer'],
    default: 'buyer',
  },
  avatar: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  // Login history (last 20 logins)
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  }],
  // Buyer-specific fields
  buyerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    default: null,
  },
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hide sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
