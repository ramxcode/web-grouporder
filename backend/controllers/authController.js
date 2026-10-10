const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const validate = require('../middleware/validate');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/login
const loginValidation = [
  body('identifier').notEmpty().withMessage('Email or WhatsApp is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const login = [
  ...loginValidation,
  validate,
  async (req, res) => {
    try {
      const { identifier, password } = req.body;

      // Find user by email, whatsapp, or username
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase().trim() },
          { whatsapp: identifier.trim() },
          { username: identifier.toLowerCase().trim() },
        ],
        isActive: true,
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      // Check if seller is suspended/disabled
      if (user.role === 'seller') {
        const sellerProfile = await Seller.findOne({ user: user._id, isDeleted: false });
        if (sellerProfile && sellerProfile.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: 'Akun Seller Anda sedang dinonaktifkan. Silakan hubungi administrator.',
          });
        }
      }

      // Update last login + record login history
      user.lastLogin = new Date();
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '';
      const ua = req.headers['user-agent'] || '';
      user.loginHistory = [{ timestamp: new Date(), ipAddress: ip, userAgent: ua }, ...(user.loginHistory || [])].slice(0, 20);
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user);

      // If buyer, fetch buyer profile
      let buyerProfile = null;
      if (user.role === 'buyer' && user.buyerRef) {
        buyerProfile = await Buyer.findById(user.buyerRef);
      }

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          whatsapp: user.whatsapp,
          role: user.role,
          avatar: user.avatar,
          buyerRef: user.buyerRef,
          lastLogin: user.lastLogin,
        },
        buyerProfile,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
];

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let buyerProfile = null;
    if (user.role === 'buyer' && user.buyerRef) {
      buyerProfile = await Buyer.findById(user.buyerRef);
    }
    res.json({ success: true, user, buyerProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, getMe, changePassword };
