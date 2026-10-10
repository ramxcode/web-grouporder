const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Token is invalid or user no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    next(error);
  }
};

// Role-based authorization
// super_admin always has access unless explicitly restricted
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    // Super admin can access everything except buyer-only routes
    if (req.user.role === 'super_admin' && !roles.includes('buyer_only')) {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

// Seller isolation middleware - ensures seller can only access own data
// super_admin bypasses isolation
const sellerIsolation = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    // Super admin sees all — no seller filter
    req.sellerFilter = {};
    req.isSuperAdmin = true;
  } else if (req.user.role === 'seller') {
    req.sellerFilter = { seller: req.user._id };
    req.isSuperAdmin = false;
  } else if (req.user.role === 'buyer') {
    req.sellerFilter = {};
    req.isSuperAdmin = false;
  }
  next();
};

module.exports = { authenticate, authorize, sellerIsolation };
