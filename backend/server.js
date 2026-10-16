require('dotenv').config();

// Prevent crash from unhandled errors — log instead
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');

const app = express();

// Connect to database
connectDB();

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — manual middleware, lebih reliable dengan Express 5
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'https://web-grouporder.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean).map(o => o.replace(/\/$/, '')));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Izinkan jika origin tidak ada (curl/server) atau ada di daftar
  if (!origin || allowedOrigins.has(origin)) {
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  } else {
    console.warn('CORS blocked origin:', origin);
  }
  // Balas preflight OPTIONS langsung
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/buyers', require('./routes/buyers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api', require('./routes/misc'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'WEB REKAPAN GO API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists.`,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 WEB REKAPAN GO Backend running on port ${PORT}`);
  console.log(`📱 Mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
