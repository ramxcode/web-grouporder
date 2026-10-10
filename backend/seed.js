require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Buyer = require('./models/Buyer');
const Order = require('./models/Order');
const Payment = require('./models/Payment');
const Stock = require('./models/Stock');
const Settings = require('./models/Settings');
const Seller = require('./models/Seller');
const WebsiteSettings = require('./models/WebsiteSettings');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

const { generateOrderId } = require('./utils/helpers');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Buyer.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Stock.deleteMany({}),
      Settings.deleteMany({}),
      Seller.deleteMany({}),
      WebsiteSettings.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create Super Admin / Owner account
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'owner@webrekapango.com',
      whatsapp: '08100000000',
      password: 'owner123',
      role: 'super_admin',
      isActive: true,
    });
    console.log('✅ Super Admin created: owner@webrekapango.com / owner123');

    // Create WebsiteSettings
    await WebsiteSettings.create({
      siteName: 'WEB REKAPAN GO',
      shortName: 'REKAPAN GO',
      tagline: 'Kelola Group Order Jadi Lebih Mudah',
      singleton: true,
    });
    console.log('✅ Website Settings created');

    // Create seller account
    const sellerUser = await User.create({
      name: 'Admin Seller',
      email: 'admin@webrekapango.com',
      whatsapp: '08123456789',
      password: 'admin123',
      role: 'seller',
      isActive: true,
    });

    // Create Seller profile
    const sellerProfile = await Seller.create({
      sellerId: 'SELLER-0001',
      user: sellerUser._id,
      namaGO: 'GO Admin Demo',
      email: 'admin@webrekapango.com',
      whatsapp: '08123456789',
      status: 'active',
      notes: 'Demo seller account',
    });
    const seller = sellerUser;
    console.log('✅ Seller created: admin@webrekapango.com / admin123');

    // Create buyers
    const buyerData = [
      { name: 'Siti Rahayu', whatsapp: '081234567001', email: 'siti@example.com' },
      { name: 'Budi Santoso', whatsapp: '081234567002', email: 'budi@example.com' },
      { name: 'Dewi Lestari', whatsapp: '081234567003', email: 'dewi@example.com' },
      { name: 'Andi Wijaya', whatsapp: '081234567004', email: 'andi@example.com' },
      { name: 'Rina Kusuma', whatsapp: '081234567005', email: 'rina@example.com' },
    ];

    const buyers = [];
    const buyerUsers = [];

    for (const bd of buyerData) {
      const buyer = await Buyer.create({ ...bd, status: 'active', seller: seller._id });
      buyers.push(buyer);

      // Create user accounts for first 3 buyers
      if (buyers.length <= 3) {
        const buyerUser = await User.create({
          name: bd.name,
          email: bd.email,
          whatsapp: bd.whatsapp,
          password: 'buyer123',
          role: 'buyer',
          buyerRef: buyer._id,
          isActive: true,
        });
        buyer.userAccount = buyerUser._id;
        await buyer.save();
        buyerUsers.push(buyerUser);
        console.log(`✅ Buyer account: ${bd.email} / buyer123`);
      }
    }

    // Create settings
    await Settings.create({
      singleton: true,
      namaGroupOrder: 'WEB REKAPAN GO',
      whatsapp: '08123456789',
      email: 'admin@webrekapango.com',
      defaultWarehouse: 'WH KR',
      rekeningBank: [
        { bankName: 'BCA', accountNumber: '1234567890', accountName: 'Admin Seller' },
        { bankName: 'Mandiri', accountNumber: '9876543210', accountName: 'Admin Seller' },
      ],
    });
    console.log('✅ Settings created');

    // Create orders with various statuses
    const statuses = ['Ordered', 'WH KR', 'WH JP', 'Arrived INA', 'Arrived Admin', 'Done CO'];
    const paymentStatuses = ['Unpaid', 'DP', 'Paid'];
    const warehouses = ['WH KR', 'WH JP', 'WH Taiwan', ''];
    const items = [
      'Baju Hanbok Korea',
      'Tas Kulit Premium',
      'Sepatu Sneakers Japan',
      'Kosmetik Korea Set',
      'Action Figure Limited',
      'Parfum Eropa',
      'Jam Tangan Vintage',
      'Pakaian Olahraga Japan',
      'Skincare Taiwan Premium',
      'Aksesoris Fashion Korea',
    ];

    const createdOrders = [];
    let orderSeq = 1;

    for (let i = 0; i < 25; i++) {
      const buyer = buyers[i % buyers.length];
      const item = items[i % items.length];
      const hargaBeli = (Math.floor(Math.random() * 10) + 5) * 50000;
      const hargaJual = hargaBeli + (Math.floor(Math.random() * 5) + 1) * 50000;
      const status = statuses[i % statuses.length];
      const dp = i % 3 === 0 ? 0 : Math.floor(hargaJual * 0.5);
      const pelunasan = status === 'Done CO' || i % 5 === 0 ? hargaJual - dp : 0;

      const dateOffset = i * 3;
      const orderDate = new Date('2026-09-01');
      orderDate.setDate(orderDate.getDate() + dateOffset);

      const dateStr = `${orderDate.getFullYear()}${String(orderDate.getMonth()+1).padStart(2,'0')}${String(orderDate.getDate()).padStart(2,'0')}`;
      const orderId = `GO-${dateStr}-${String(orderSeq++).padStart(4,'0')}`;

      const statusHistory = [
        {
          status: 'Ordered',
          changedBy: seller._id,
          changedByName: 'Admin Seller',
          note: 'Order created',
          createdAt: orderDate,
        }
      ];

      if (status !== 'Ordered') {
        const whStatuses = ['WH KR', 'WH JP', 'WH Taiwan', 'WH Thai', 'WH US'];
        const statusIdx = statuses.indexOf(status);
        for (let j = 1; j <= statusIdx; j++) {
          const prevDate = new Date(orderDate);
          prevDate.setDate(prevDate.getDate() + j * 5);
          statusHistory.push({
            status: statuses[j],
            changedBy: seller._id,
            changedByName: 'Admin Seller',
            note: '',
            createdAt: prevDate,
          });
        }
      }

      const order = await Order.create({
        orderId,
        seller: seller._id,
        buyer: buyer._id,
        item,
        quantity: Math.floor(Math.random() * 3) + 1,
        website: ['Qoo10', 'Shopee KR', 'Tokopedia', 'Lazada', 'Taobao'][i % 5],
        hargaBeli,
        hargaJual,
        dp,
        fixPrice: 0,
        pelunasan,
        warehouse: warehouses[i % warehouses.length],
        nomorResi: status !== 'Ordered' ? `TRK${Math.random().toString(36).substr(2, 10).toUpperCase()}` : '',
        statusBarang: status,
        statusHistory,
        notes: i % 4 === 0 ? 'Mohon dikonfirmasi setelah tiba' : '',
      });

      createdOrders.push(order);

      // Create payment records if paid
      if (dp > 0) {
        await Payment.create({
          order: order._id,
          buyer: buyer._id,
          amount: dp,
          type: 'DP',
          method: ['QRIS', 'Bank Transfer', 'E-Wallet'][i % 3],
          tanggal: new Date(orderDate.getTime() + 1 * 24 * 60 * 60 * 1000),
          status: 'Confirmed',
          confirmedBy: seller._id,
          notes: 'DP dikonfirmasi',
        });
      }

      if (pelunasan > 0) {
        await Payment.create({
          order: order._id,
          buyer: buyer._id,
          amount: pelunasan,
          type: 'Pelunasan',
          method: ['QRIS', 'Bank Transfer', 'Cash'][i % 3],
          tanggal: new Date(orderDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          status: 'Confirmed',
          confirmedBy: seller._id,
          notes: 'Lunas',
        });
      }
    }
    console.log(`✅ Created ${createdOrders.length} orders`);

    // Update buyer summaries
    for (const buyer of buyers) {
      const orders = await Order.find({ buyer: buyer._id, isDeleted: false });
      buyer.totalOrders = orders.length;
      buyer.totalTagihan = orders.reduce((s, o) => s + (o.hargaJual || 0), 0);
      buyer.totalPembayaran = orders.reduce((s, o) => s + (o.totalPembayaran || 0), 0);
      buyer.sisaTagihan = Math.max(0, buyer.totalTagihan - buyer.totalPembayaran);
      await buyer.save();
    }
    console.log('✅ Buyer summaries updated');

    // Create stocks
    const stockItems = [
      { namaBarang: 'Baju Hanbok Korea', variant: 'Size M, Warna Biru', quantity: 2, harga: 350000 },
      { namaBarang: 'Tas Kulit Premium', variant: 'Warna Hitam', quantity: 1, harga: 750000 },
      { namaBarang: 'Sepatu Sneakers Japan', variant: 'Size 40', quantity: 1, harga: 500000 },
      { namaBarang: 'Kosmetik Korea Set', variant: 'Paket Lengkap', quantity: 3, harga: 250000 },
      { namaBarang: 'Skincare Taiwan Premium', variant: 'Set 5 Produk', quantity: 2, harga: 450000 },
    ];

    for (let i = 0; i < stockItems.length; i++) {
      await Stock.create({
        ...stockItems[i],
        buyer: buyers[i % buyers.length]._id,
        warehouse: ['WH KR', 'WH JP', 'Indonesia', 'WH Taiwan', 'WH US'][i % 5],
        status: ['Available', 'Reserved', 'Available', 'Sold', 'Waiting Arrival'][i % 5],
        tanggalMasuk: new Date('2026-10-01'),
        notes: `Stok milik ${buyers[i % buyers.length].name}`,
      });
    }
    console.log('✅ Stocks created');

    // Create notifications for buyers
    for (const buyerUser of buyerUsers) {
      const buyerOrders = createdOrders.filter(o => {
        const buyerDoc = buyers.find(b => b.userAccount?.toString() === buyerUser._id.toString());
        return buyerDoc && o.buyer.toString() === buyerDoc._id.toString();
      });

      for (const order of buyerOrders.slice(0, 3)) {
        await Notification.create({
          recipient: buyerUser._id,
          recipientRole: 'buyer',
          title: 'Status Order Berubah',
          message: `Order ${order.orderId} - ${order.item} telah diperbarui ke status ${order.statusBarang}`,
          type: 'order_status',
          relatedOrder: order._id,
          isRead: false,
        });
      }
    }
    console.log('✅ Notifications created');

    console.log('\n========================================');
    console.log('🎉 SEED DATA BERHASIL DIBUAT!');
    console.log('========================================');
    console.log('SUPER ADMIN / OWNER LOGIN:');
    console.log('  Email: owner@webrekapango.com');
    console.log('  Password: owner123');
    console.log('');
    console.log('SELLER LOGIN:');
    console.log('  Email: admin@webrekapango.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('BUYER LOGIN (3 akun):');
    buyerData.slice(0, 3).forEach(bd => {
      console.log(`  Email: ${bd.email} / Password: buyer123`);
      console.log(`  WA: ${bd.whatsapp} / Password: buyer123`);
    });
    console.log('========================================\n');


    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
