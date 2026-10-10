const Stock = require('../models/Stock');
const Buyer = require('../models/Buyer');
const createAuditLog = require('../utils/auditLogger');
const path = require('path');

// GET /api/stocks - List stocks
const getStocks = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', buyerId, warehouse, status } = req.query;
    const query = {};

    // Buyer can only see own stocks, seller sees own, super_admin sees all
    if (req.user.role === 'buyer') {
      query.buyer = req.user.buyerRef;
    } else if (req.user.role === 'seller') {
      query.seller = req.user._id;
      if (buyerId) query.buyer = buyerId;
    } else if (buyerId) {
      query.buyer = buyerId;
    }

    if (warehouse) query.warehouse = warehouse;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { namaBarang: { $regex: search, $options: 'i' } },
        { variant: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Stock.countDocuments(query);
    const stocks = await Stock.find(query)
      .populate('buyer', 'name whatsapp')
      .populate('order', 'orderId item')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: stocks,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/stocks/:id
const getStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id)
      .populate('buyer', 'name whatsapp email')
      .populate('order', 'orderId item');

    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });

    if (req.user.role === 'buyer') {
      if (stock.buyer?._id.toString() !== req.user.buyerRef?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    res.json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/stocks - Create stock (seller only)
const createStock = async (req, res) => {
  try {
    const { namaBarang, variant, quantity, harga, buyerId, orderId, warehouse, customWarehouse, status, tanggalMasuk, notes } = req.body;

    if (!namaBarang) {
      return res.status(400).json({ success: false, message: 'Nama barang is required.' });
    }

    const stockData = {
      namaBarang,
      seller: req.user._id,
      variant: variant || '',
      quantity: quantity || 1,
      harga: harga || 0,
      buyer: buyerId || null,
      order: orderId || null,
      warehouse: warehouse || '',
      customWarehouse: customWarehouse || '',
      status: status || 'Waiting Arrival',
      tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : null,
      notes: notes || '',
    };

    // Handle uploaded photo
    if (req.file) {
      stockData.foto = `/uploads/${req.file.filename}`;
    }

    const stock = await Stock.create(stockData);

    await createAuditLog({
      action: 'CREATE',
      entity: 'Stock',
      entityId: stock._id,
      entityRef: stock.namaBarang,
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Stock ${stock.namaBarang} created`,
      ipAddress: req.ip,
    });

    const populated = await Stock.findById(stock._id)
      .populate('buyer', 'name')
      .populate('order', 'orderId item');

    res.status(201).json({ success: true, data: populated, message: 'Stock created.' });
  } catch (error) {
    console.error('Create stock error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/stocks/:id - Update stock (seller only)
const updateStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });

    const before = stock.toObject();
    const { namaBarang, variant, quantity, harga, buyerId, orderId, warehouse, customWarehouse, status, tanggalMasuk, notes } = req.body;

    if (namaBarang) stock.namaBarang = namaBarang;
    if (variant !== undefined) stock.variant = variant;
    if (quantity !== undefined) stock.quantity = quantity;
    if (harga !== undefined) stock.harga = harga;
    if (buyerId !== undefined) stock.buyer = buyerId || null;
    if (orderId !== undefined) stock.order = orderId || null;
    if (warehouse !== undefined) stock.warehouse = warehouse;
    if (customWarehouse !== undefined) stock.customWarehouse = customWarehouse;
    if (status) stock.status = status;
    if (tanggalMasuk !== undefined) stock.tanggalMasuk = tanggalMasuk ? new Date(tanggalMasuk) : null;
    if (notes !== undefined) stock.notes = notes;
    if (req.file) stock.foto = `/uploads/${req.file.filename}`;

    await stock.save();

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Stock',
      entityId: stock._id,
      entityRef: stock.namaBarang,
      performedBy: req.user._id,
      performedByName: req.user.name,
      changes: { before, after: stock.toObject() },
      description: `Stock ${stock.namaBarang} updated`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: stock, message: 'Stock updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/stocks/:id
const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });

    await Stock.findByIdAndDelete(req.params.id);

    await createAuditLog({
      action: 'DELETE',
      entity: 'Stock',
      entityId: stock._id,
      entityRef: stock.namaBarang,
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Stock ${stock.namaBarang} deleted`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Stock deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/stocks/:id/quantity - Adjust quantity
const adjustQuantity = async (req, res) => {
  try {
    const { adjustment, type } = req.body; // type: 'add' | 'subtract'
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found.' });

    const amount = parseInt(adjustment);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid adjustment amount.' });
    }

    if (type === 'add') {
      stock.quantity += amount;
    } else if (type === 'subtract') {
      if (stock.quantity < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient stock quantity.' });
      }
      stock.quantity -= amount;
    } else {
      return res.status(400).json({ success: false, message: 'Type must be add or subtract.' });
    }

    await stock.save();
    res.json({ success: true, data: stock, message: `Stock quantity ${type === 'add' ? 'increased' : 'decreased'} by ${amount}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getStocks, getStock, createStock, updateStock, deleteStock, adjustQuantity };
