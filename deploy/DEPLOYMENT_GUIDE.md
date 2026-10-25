# 🚀 Panduan Deployment Web Rekapan GO ke VPS + Domain

> **Stack**: Node.js + Express (Backend) · React + Vite (Frontend) · MongoDB · Nginx · PM2 · Let's Encrypt SSL

---

## 📋 Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Konfigurasi DNS Domain](#2-konfigurasi-dns-domain)
3. [Koneksi ke VPS (SSH)](#3-koneksi-ke-vps-ssh)
4. [Upload Project ke VPS](#4-upload-project-ke-vps)
5. [Isi Konfigurasi Deploy Script](#5-isi-konfigurasi-deploy-script)
6. [Jalankan Deployment Otomatis](#6-jalankan-deployment-otomatis)
7. [Verifikasi Deployment](#7-verifikasi-deployment)
8. [Update Kode Setelah Deploy Pertama](#8-update-kode-setelah-deploy-pertama)
9. [Perintah Penting Cheat Sheet](#9-perintah-penting-cheat-sheet)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Persiapan Awal

### Yang Anda butuhkan:
- VPS Ubuntu 22.04 atau 24.04 (2GB RAM, 1 Core, NVMe 128GB)
- IP Publik VPS (contoh: `103.xx.xx.xx`)
- Domain yang sudah dibeli (contoh: `rekapanku.com`)
- Akses SSH ke VPS
- Project ini di komputer lokal

### Di komputer lokal (Windows), install:
- **Git Bash** atau **WSL** (untuk menjalankan script `.sh`)
- **WinSCP** atau gunakan `scp` via Git Bash (untuk upload file)

---

## 2. Konfigurasi DNS Domain

Masuk ke panel domain Anda (Cloudflare, Niagahoster, IDCloudHost, dll) dan tambahkan DNS record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| `A` | `@` | `IP_VPS_ANDA` | Auto |
| `A` | `www` | `IP_VPS_ANDA` | Auto |

**Jika menggunakan Cloudflare:**
1. Login ke dash.cloudflare.com
2. Pilih domain → klik **DNS** → **Add record**
3. Tambahkan 2 record A di atas
4. Set Proxy Status ke **DNS only (abu-abu)** dulu — bukan orange (proxied)

> Propagasi DNS bisa memakan waktu 5–30 menit. Cek di: https://dnschecker.org

---

## 3. Koneksi ke VPS (SSH)

Buka **Git Bash** di komputer Anda:

```bash
# Jika menggunakan password:
ssh username@IP_VPS_ANDA

# Jika menggunakan SSH key:
ssh -i /path/to/private_key username@IP_VPS_ANDA
```

### Buat user non-root (disarankan, jangan pakai root):
```bash
# Di VPS sebagai root:
adduser deploy
usermod -aG sudo deploy
su - deploy
```

---

## 4. Upload Project ke VPS

### Cara A: Via Git (Direkomendasikan)

```bash
# Di VPS:
cd ~
git clone https://github.com/USERNAME/REPO_NAME.git web-rekapan-go
cd web-rekapan-go
```

### Cara B: Via SCP dari Windows (Git Bash)

```bash
# Buka Git Bash di komputer lokal, jalankan dari folder project:
cd "D:/Request Project/Web Group Order - Request"

scp -r ./deploy ./backend ./frontend deploy@103.xx.xx.xx:/home/deploy/web-rekapan-go/
```

---

## 5. Isi Konfigurasi Deploy Script

Di VPS, buka dan edit file `deploy.sh`:

```bash
cd /home/deploy/web-rekapan-go/deploy
nano deploy.sh
```

Cari bagian `KONFIGURASI` dan isi variabel berikut:

```bash
DOMAIN="rekapanku.com"     # Domain tanpa www, tanpa https://
MONGODB_URI=""             # Kosongkan = pakai MongoDB lokal di VPS
                           # Atau isi: mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET="xxx"           # String acak minimal 32 karakter
ADMIN_EMAIL="email@anda.com"  # Email untuk notifikasi SSL
```

**Generate JWT_SECRET yang aman:**
```bash
openssl rand -base64 48
```

Simpan: `Ctrl+X` → `Y` → `Enter`

---

## 6. Jalankan Deployment Otomatis

```bash
cd /home/deploy/web-rekapan-go/deploy
chmod +x deploy.sh update.sh
bash deploy.sh
```

Script otomatis menjalankan semua langkah:

| # | Langkah | Estimasi |
|---|---------|----------|
| 1 | Setup Swap Memory 2GB | ~1 menit |
| 2 | Update sistem + install Nginx, Certbot | ~5 menit |
| 3 | Install Node.js 20 via NVM | ~2 menit |
| 4 | Install MongoDB 7 | ~3 menit |
| 5 | Setup direktori aplikasi | <1 menit |
| 6 | Deploy Backend (npm install) | ~2 menit |
| 7 | Build + Deploy Frontend (npm run build) | ~3 menit |
| 8 | Konfigurasi Nginx | <1 menit |
| 9 | Konfigurasi Firewall UFW | <1 menit |
| 10 | Setup SSL HTTPS Let's Encrypt | ~2 menit |
| 11 | Jalankan Backend dengan PM2 | <1 menit |

**Total estimasi: ~20–25 menit**

---

## 7. Verifikasi Deployment

Setelah script selesai:

### Cek website:
Buka browser: `https://rekapanku.com`

### Cek API health:
```bash
curl https://rekapanku.com/api/health
# {"success":true,"message":"WEB REKAPAN GO API is running",...}
```

### Cek status semua service:
```bash
pm2 status                    # Backend harus: online
sudo systemctl status nginx   # Harus: active (running)
sudo systemctl status mongod  # Harus: active (running)
sudo certbot certificates     # SSL harus: VALID
```

---

## 8. Update Kode Setelah Deploy Pertama

### Upload perubahan ke VPS:
```bash
# Via Git:
cd /home/deploy/web-rekapan-go
git pull origin main

# Via SCP dari lokal:
scp -r ./backend ./frontend deploy@103.xx.xx.xx:/home/deploy/web-rekapan-go/
```

### Jalankan script update:
```bash
cd /home/deploy/web-rekapan-go/deploy

bash update.sh           # Update semua (backend + frontend)
bash update.sh backend   # Backend saja
bash update.sh frontend  # Frontend saja
```

---

## 9. Perintah Penting Cheat Sheet

### PM2 - Manajemen Backend:
```bash
pm2 status                           # Lihat status
pm2 logs web-rekapan-go              # Log real-time
pm2 logs web-rekapan-go --lines 50   # 50 baris terakhir
pm2 restart web-rekapan-go           # Restart backend
pm2 monit                            # Monitor CPU/RAM
```

### Nginx:
```bash
sudo nginx -t                            # Test konfigurasi
sudo systemctl reload nginx             # Reload (tanpa downtime)
sudo tail -f /var/log/nginx/error.log   # Error log
```

### MongoDB:
```bash
sudo systemctl status mongod    # Status
sudo systemctl restart mongod   # Restart
mongosh                         # Masuk MongoDB shell
```

### SSL:
```bash
sudo certbot certificates       # Lihat certificate
sudo certbot renew --dry-run    # Test auto-renewal
```

### Sistem:
```bash
free -h     # RAM + Swap
df -h       # Disk usage
htop        # Monitor sistem
```

---

## 10. Troubleshooting

### 502 Bad Gateway
Backend tidak berjalan:
```bash
pm2 restart web-rekapan-go
pm2 logs web-rekapan-go --lines 30
```

### Halaman React 404 saat refresh
Pastikan konfigurasi Nginx ada `try_files`:
```bash
sudo nano /etc/nginx/sites-available/web-rekapan-go
# Pastikan ada: try_files $uri $uri/ /index.html;
sudo nginx -t && sudo systemctl reload nginx
```

### SSL gagal
Pastikan DNS sudah propagasi:
```bash
nslookup rekapanku.com
# Harus return IP VPS Anda
sudo certbot --nginx -d rekapanku.com -d www.rekapanku.com
```

### MongoDB tidak konek
```bash
sudo systemctl restart mongod
sudo journalctl -u mongod --no-pager -n 30
```

### NVM tidak ditemukan setelah login
```bash
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
source ~/.bashrc
```

---

## Struktur File di VPS Setelah Deploy

```
/home/deploy/web-rekapan-go/
├── backend/
│   ├── .env           <- rahasia, jangan di-share!
│   ├── uploads/       <- file upload user
│   └── ...
├── frontend/
│   └── ...
├── logs/
│   └── app.log
└── deploy/
    ├── deploy.sh
    └── update.sh

/var/www/html/web-rekapan-go/   <- hasil build React (di-serve Nginx)
/etc/nginx/sites-available/web-rekapan-go  <- konfigurasi Nginx
```

> **Penting**: Jangan pernah commit file `.env` ke Git. Simpan kredensial di password manager.
