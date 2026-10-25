const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const Stock = require('../models/Stock');
const { generateOrderId, updateBuyerSummary } = require('../utils/helpers');
const createAuditLog = require('../utils/auditLogger');
const createNotification = require('../utils/notificationHelper');

// GET /api/orders - List orders (seller: all, buyer: own)
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      buyerId,
      paymentStatus,
      statusBarang,
      warehouse,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { isDeleted: false };

    // Buyer can only see own orders, seller sees own, super_admin sees all
    if (req.user.role === 'buyer') {
      query.buyer = req.user.buyerRef;
    } else if (req.user.role === 'seller') {
      query.seller = req.user._id;
      if (buyerId) query.buyer = buyerId;
    } else if (buyerId) {
      // super_admin with filter
      query.buyer = buyerId;
    }

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (statusBarang) query.statusBarang = statusBarang;
    if (warehouse) query.warehouse = warehouse;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }

    if (search) {
      const buyers = await Buyer.find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      const buyerIds = buyers.map(b => b._id);

      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { item: { $regex: search, $options: 'i' } },
        { nomorResi: { $regex: search, $options: 'i' } },
        { buyer: { $in: buyerIds } },
      ];
    }

    const total = await Order.countDocuments(query);
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const orders = await Order.find(query)
      .populate('buyer', 'name whatsapp email')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // For buyer, hide cost price and profit
    let filteredOrders = orders;
    if (req.user.role === 'buyer') {
      filteredOrders = orders.map(o => {
        const obj = o.toObject();
        delete obj.hargaBeli;
        delete obj.profit;
        return obj;
      });
    }

    res.json({
      success: true,
      data: filteredOrders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/orders/:id - Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name whatsapp email')
      .populate('statusHistory.changedBy', 'name');

    if (!order || order.isDeleted) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Buyer can only see their own order
    if (req.user.role === 'buyer') {
      if (order.buyer._id.toString() !== req.user.buyerRef?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      const obj = order.toObject();
      delete obj.hargaBeli;
      delete obj.profit;
      return res.json({ success: true, data: obj });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/orders - Create order (seller only)
const createOrder = async (req, res) => {
  try {
    const {
      buyer: buyerId,
      item,
      quantity,
      website,
      hargaBeli,
      hargaJual,
      dp,
      fixPrice,
      pelunasan,
      warehouse,
      nomorResi,
      statusBarang,
      notes,
    } = req.body;

    if (!buyerId || !item || !hargaJual) {
      return res.status(400).json({ success: false, message: 'Buyer, item, and harga jual are required.' });
    }

    const buyer = await Buyer.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found.' });
    }

    const orderId = await generateOrderId();

    const order = await Order.create({
      orderId,
      seller: req.user._id,
      buyer: buyerId,
      item,
      quantity: quantity || 1,
      website,
      hargaBeli: hargaBeli || 0,
      hargaJual,
      dp: dp || 0,
      fixPrice: fixPrice || 0,
      pelunasan: pelunasan || 0,
      warehouse: warehouse || '',
      nomorResi: nomorResi || '',
      statusBarang: statusBarang || 'Ordered',
      notes: notes || '',
      statusHistory: [{
        status: statusBarang || 'Ordered',
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: 'Order created',
      }],
    });

    await updateBuyerSummary(buyerId);

    // Auto-reduce matching stock quantity
    const orderedQty = order.quantity || 1;
    const matchingStocks = await Stock.find({
      seller: req.user._id,
      buyer: buyerId,
      namaBarang: { $regex: new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      quantity: { $gt: 0 },
    }).sort({ createdAt: 1 });

    let remainingToReduce = orderedQty;
    for (const stk of matchingStocks) {
      if (remainingToReduce <= 0) break;
      const reduce = Math.min(stk.quantity, remainingToReduce);
      stk.quantity -= reduce;
      remainingToReduce -= reduce;
      await stk.save();
    }

    await createAuditLog({
      action: 'CREATE',
      entity: 'Order',
      entityId: order._id,
      entityRef: order.orderId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Order ${order.orderId} created for ${buyer.name}`,
      ipAddress: req.ip,
    });

    // Notify buyer if linked
    if (buyer.userAccount) {
      await createNotification({
        recipient: buyer.userAccount,
        recipientRole: 'buyer',
        title: 'Order Baru Ditambahkan',
        message: `Order ${order.orderId} - ${item} telah ditambahkan.`,
        type: 'order_new',
        relatedOrder: order._id,
      });
    }

    const populated = await Order.findById(order._id).populate('buyer', 'name whatsapp email');
    res.status(201).json({ success: true, data: populated, message: 'Order created successfully.' });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/orders/:id - Update order (seller only)
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.isDeleted) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const before = order.toObject();
    const {
      item, quantity, website, hargaBeli, hargaJual, dp, fixPrice, pelunasan,
      warehouse, nomorResi, notes, statusNote,
    } = req.body;

    // Track status change
    let statusChanged = false;
    let oldStatus = order.statusBarang;
    let newStatus = req.body.statusBarang;

    if (item !== undefined) order.item = item;
    if (quantity !== undefined) order.quantity = quantity;
    if (website !== undefined) order.website = website;
    if (hargaBeli !== undefined) order.hargaBeli = hargaBeli;
    if (hargaJual !== undefined) order.hargaJual = hargaJual;
    if (dp !== undefined) order.dp = dp;
    if (fixPrice !== undefined) order.fixPrice = fixPrice;
    if (pelunasan !== undefined) order.pelunasan = pelunasan;
    if (warehouse !== undefined) order.warehouse = warehouse;
    if (nomorResi !== undefined) order.nomorResi = nomorResi;
    if (notes !== undefined) order.notes = notes;

    if (newStatus && newStatus !== oldStatus) {
      order.statusBarang = newStatus;
      statusChanged = true;
      order.statusHistory.push({
        status: newStatus,
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: statusNote || '',
      });
    }

    await order.save();
    await updateBuyerSummary(order.buyer);

    const after = order.toObject();

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Order',
      entityId: order._id,
      entityRef: order.orderId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      changes: { before, after },
      description: statusChanged
        ? `Status changed: ${oldStatus} → ${newStatus}`
        : `Order ${order.orderId} updated`,
      ipAddress: req.ip,
    });

    // Notify buyer on status change
    if (statusChanged) {
      const buyer = await Buyer.findById(order.buyer);
      const notifMap = {
        'Arrived INA': { type: 'order_arrived_ina', title: 'Barang Arrived INA' },
        'Arrived Admin': { type: 'order_arrived_admin', title: 'Barang Arrived Admin' },
        'Done CO': { type: 'order_done', title: 'Order Selesai (Done CO)' },
      };
      const wh = ['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US'];
      const notif = notifMap[newStatus] || (wh.includes(newStatus)
        ? { type: 'order_arrived_wh', title: `Barang di ${newStatus}` }
        : { type: 'order_status', title: 'Status Order Berubah' });

      if (buyer?.userAccount) {
        await createNotification({
          recipient: buyer.userAccount,
          recipientRole: 'buyer',
          title: notif.title,
          message: `Order ${order.orderId} - ${order.item}: ${oldStatus} → ${newStatus}`,
          type: notif.type,
          relatedOrder: order._id,
        });
      }
    }

    const populated = await Order.findById(order._id).populate('buyer', 'name whatsapp email');
    res.json({ success: true, data: populated, message: 'Order updated successfully.' });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/orders/:id - Soft delete (seller only)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.isDeleted) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.isDeleted = true;
    await order.save();
    await updateBuyerSummary(order.buyer);

    await createAuditLog({
      action: 'DELETE',
      entity: 'Order',
      entityId: order._id,
      entityRef: order.orderId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: `Order ${order.orderId} deleted`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Order deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/orders/bulk-status - Bulk update status (seller only)
const bulkUpdateStatus = async (req, res) => {
  try {
    const { orderIds, statusBarang, statusNote } = req.body;
    if (!orderIds || !orderIds.length || !statusBarang) {
      return res.status(400).json({ success: false, message: 'orderIds and statusBarang are required.' });
    }

    const orders = await Order.find({ _id: { $in: orderIds }, isDeleted: false });
    const buyerIds = new Set();

    for (const order of orders) {
      const oldStatus = order.statusBarang;
      order.statusBarang = statusBarang;
      order.statusHistory.push({
        status: statusBarang,
        changedBy: req.user._id,
        changedByName: req.user.name,
        note: statusNote || 'Bulk status update',
      });
      await order.save();
      buyerIds.add(order.buyer.toString());

      await createAuditLog({
        action: 'BULK_UPDATE',
        entity: 'Order',
        entityId: order._id,
        entityRef: order.orderId,
        performedBy: req.user._id,
        performedByName: req.user.name,
        description: `Bulk status change: ${oldStatus} → ${statusBarang}`,
        ipAddress: req.ip,
      });
    }

    for (const buyerId of buyerIds) {
      await updateBuyerSummary(buyerId);
    }

    res.json({ success: true, message: `${orders.length} orders updated to ${statusBarang}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, deleteOrder, bulkUpdateStatus };
