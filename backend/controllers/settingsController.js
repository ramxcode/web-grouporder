const Settings = require('../models/Settings');
const createAuditLog = require('../utils/auditLogger');

// GET /api/settings - Get settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ singleton: true });
    if (!settings) {
      settings = await Settings.create({ singleton: true });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/settings - Update settings (seller only)
const updateSettings = async (req, res) => {
  try {
    const {
      namaGroupOrder,
      whatsapp,
      email,
      rekeningBank,
      defaultWarehouse,
    } = req.body;

    const update = {};
    if (namaGroupOrder) update.namaGroupOrder = namaGroupOrder;
    if (whatsapp !== undefined) update.whatsapp = whatsapp;
    if (email !== undefined) update.email = email;
    if (rekeningBank !== undefined) update.rekeningBank = rekeningBank;
    if (defaultWarehouse !== undefined) update.defaultWarehouse = defaultWarehouse;

    if (req.files?.logo) {
      update.logo = `/uploads/${req.files.logo[0].filename}`;
    }
    if (req.files?.qris) {
      update.qrisImage = `/uploads/${req.files.qris[0].filename}`;
    }

    const settings = await Settings.findOneAndUpdate(
      { singleton: true },
      { $set: update },
      { new: true, upsert: true }
    );

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Settings',
      entityId: settings._id,
      entityRef: 'Settings',
      performedBy: req.user._id,
      performedByName: req.user.name,
      description: 'Settings updated',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: settings, message: 'Settings updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getSettings, updateSettings };
