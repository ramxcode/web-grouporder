const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { getStocks, getStock, createStock, updateStock, deleteStock, adjustQuantity } = require('../controllers/stockController');

// Configure multer for stock photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'stock-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.get('/', authenticate, getStocks);
router.get('/:id', authenticate, getStock);
router.post('/', authenticate, authorize('seller'), upload.single('foto'), createStock);
router.put('/:id', authenticate, authorize('seller'), upload.single('foto'), updateStock);
router.delete('/:id', authenticate, authorize('seller'), deleteStock);
router.patch('/:id/quantity', authenticate, authorize('seller'), adjustQuantity);

module.exports = router;
