# WEB REKAPAN GO 🛍️

Sistem manajemen Group Order (GO) full-stack dengan dashboard seller dan buyer.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Vanilla CSS |
| Backend | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Styling | Vanilla CSS (no framework) |

---

## Struktur Project

```
Web Group Order - Request/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth, validate
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   ├── utils/          # Helpers, audit logger
│   ├── uploads/        # File uploads (auto-created)
│   ├── .env            # Environment variables
│   ├── seed.js         # Demo data
│   └── server.js       # Entry point
└── frontend/
    └── src/
        ├── components/     # Layout, Sidebar, Header, UI
        ├── contexts/       # Auth, Theme
        ├── lib/            # api.js (axios), utils.js
        └── pages/
            ├── seller/     # Dashboard, StatusOrder, DataOrder, Rekapan, Payment, Stok, Buyers, AuditLog, Settings
            ├── buyer/      # Dashboard, StatusOrder, Payment, Stok
            └── shared/     # Notifications
```

---

## Setup & Menjalankan

### Prasyarat

- Node.js v18+
- MongoDB (lokal atau Atlas)

### 1. Setup Database

**Opsi A - MongoDB Atlas (Cloud, Gratis):**
1. Daftar di https://mongodb.com/atlas
2. Buat cluster M0 gratis
3. Dapatkan connection string
4. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/web-rekapan-go
   ```

**Opsi B - MongoDB Lokal:**
1. Install MongoDB Community: https://www.mongodb.com/try/download/community
2. Jalankan: `mongod --dbpath C:\data\db`
3. URI default sudah tersedia di `.env`

### 2. Backend

```bash
cd backend
npm install
npm run seed    # Load demo data
node server.js  # atau: npm run dev
```

Backend berjalan di: http://localhost:5000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di: http://localhost:5173

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Seller | admin@webrekapango.com | admin123 |
| Buyer | siti@example.com | buyer123 |
| Buyer | budi@example.com | buyer123 |
| Buyer | dewi@example.com | buyer123 |

---

## Fitur Lengkap

### Seller / Admin
- ✅ Dashboard dengan 10 summary card + distribusi status + recent activity
- ✅ Status Order — tabel lengkap + bulk action + filter + search + pagination
- ✅ Data Order — database lengkap semua order
- ✅ Rekapan Order — profit tracking + export Excel/CSV
- ✅ Payment Management — catat DP/pelunasan + auto hitung sisa
- ✅ Stok Barang — foto, variant, qty adjustment, assign ke buyer
- ✅ Buyer Management — detail per buyer (order, payment, stok, summary)
- ✅ Activity Log — riwayat semua perubahan data
- ✅ Notifikasi
- ✅ Pengaturan — nama GO, logo, QRIS, rekening bank

### Buyer
- ✅ Dashboard pribadi (hanya data milik sendiri)
- ✅ Status Order — card responsive + timeline tracking + detail modal
- ✅ Payment — per-order status + riwayat pembayaran
- ✅ Stok Barang Saya — card grid dengan foto
- ✅ Notifikasi

### Umum
- ✅ Dark Mode / Light Mode
- ✅ Responsive (desktop, tablet, mobile)
- ✅ JWT Authentication
- ✅ Role-based access control (backend validated)
- ✅ Buyer tidak bisa lihat harga beli / profit / data buyer lain
- ✅ Auto kalkulasi: sisa tagihan, profit, total pembayaran

---

## API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/dashboard/seller
GET    /api/dashboard/buyer

GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
DELETE /api/orders/:id
PATCH  /api/orders/bulk-status

GET    /api/buyers
POST   /api/buyers
GET    /api/buyers/:id
PUT    /api/buyers/:id
DELETE /api/buyers/:id

GET    /api/payments
POST   /api/payments
PUT    /api/payments/:id
DELETE /api/payments/:id

GET    /api/stocks
POST   /api/stocks
PUT    /api/stocks/:id
DELETE /api/stocks/:id
PATCH  /api/stocks/:id/quantity

GET    /api/notifications
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read
DELETE /api/notifications/:id

GET    /api/settings
PUT    /api/settings

GET    /api/audit-logs

GET    /api/export/orders
GET    /api/export/buyers
GET    /api/export/payments
GET    /api/export/stocks
```
