#!/bin/bash
# =============================================================================
#  WEB REKAPAN GO - Auto Deployment Script
#  Jalankan di VPS Ubuntu 22.04/24.04 sebagai user NON-ROOT (dengan sudo)
#  Usage: bash deploy.sh
# =============================================================================

set -e  # Hentikan script jika ada error

# ─── WARNA OUTPUT ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─── FUNGSI HELPER ────────────────────────────────────────────────────────────
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_step()    { echo -e "\n${CYAN}======================================${NC}"; echo -e "${CYAN} $1${NC}"; echo -e "${CYAN}======================================${NC}"; }

# ─── KONFIGURASI — WAJIB DIISI SEBELUM MENJALANKAN ────────────────────────────
APP_NAME="web-zastiply"
APP_DIR="/var/www/${APP_NAME}"
BACKEND_PORT=5000
DOMAIN="zastiply.web.id"            # <-- Isi domain Anda, contoh: rekapan.com
MONGODB_URI="mongodb+srv://ownrekapgo_db_user:1z1Nxj2rW5QilmIq@cluster0.j04sop2.mongodb.net/?appName=Cluster0"       # <-- Isi URI MongoDB (kosongkan untuk pakai MongoDB lokal)
JWT_SECRET="OLi5ygRBjQgmHTh_AjX0_t-kEzJCehGjV1SqqoC3zkm2GqA5x-g554E8zs8_tmtz"        # <-- Isi JWT Secret yang kuat (min 32 karakter)
ADMIN_EMAIL="ramzappremium@gmail.com"       # <-- Email untuk SSL certificate Let's Encrypt
NODE_ENV="production"

# ─── VALIDASI KONFIGURASI ─────────────────────────────────────────────────────
validate_config() {
  log_step "STEP 0: Validasi Konfigurasi"

  if [ -z "$DOMAIN" ]; then
    log_error "DOMAIN belum diisi! Edit variabel DOMAIN di bagian konfigurasi script ini."
  fi
  if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    log_error "JWT_SECRET belum diisi atau kurang dari 32 karakter!"
  fi
  if [ -z "$ADMIN_EMAIL" ]; then
    log_error "ADMIN_EMAIL belum diisi! Diperlukan untuk SSL certificate."
  fi

  # Jika MONGODB_URI kosong, gunakan MongoDB lokal
  if [ -z "$MONGODB_URI" ]; then
    MONGODB_URI="mongodb://127.0.0.1:27017/${APP_NAME}"
    log_info "MONGODB_URI tidak diisi, menggunakan MongoDB lokal."
  fi

  log_success "Konfigurasi valid."
  log_info "Domain  : $DOMAIN"
  log_info "App Dir : $APP_DIR"
  log_info "Port    : $BACKEND_PORT"
  log_info "MongoDB : $MONGODB_URI"
}

# ─── STEP 1: SWAP MEMORY 2GB ──────────────────────────────────────────────────
setup_swap() {
  log_step "STEP 1: Setup Swap Memory 2GB"

  if swapon --show | grep -q /swapfile; then
    log_warning "Swap sudah ada, skip."
    swapon --show
  else
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    log_success "Swap 2GB berhasil dibuat dan diaktifkan."
  fi
}

# ─── STEP 2: UPDATE SISTEM & INSTALL DEPENDENSI SISTEM ───────────────────────
install_system_deps() {
  log_step "STEP 2: Update Sistem & Install Dependensi"

  sudo apt-get update -y
  sudo apt-get upgrade -y
  sudo apt-get install -y \
    curl wget git rsync \
    nginx certbot python3-certbot-nginx \
    ufw

  log_success "Dependensi sistem terinstall."
}

# ─── STEP 3: INSTALL NODE.JS 24 (via NVM) ─────────────────────────────────────
install_nodejs() {
  log_step "STEP 3: Install Node.js 24 (via NVM)"

  export NVM_DIR="$HOME/.nvm"

  if [ -s "$NVM_DIR/nvm.sh" ]; then
    \. "$NVM_DIR/nvm.sh"
    log_warning "NVM sudah terinstall."
  else
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    \. "$NVM_DIR/nvm.sh"
  fi

  nvm install 24
  nvm use 24
  nvm alias default 24
  log_success "Node.js $(node -v) aktif."

  # Install PM2 secara global
  if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    log_success "PM2 terinstall."
  else
    log_warning "PM2 sudah terinstall, skip."
  fi
}

# ─── STEP 4: INSTALL MONGODB 8 ────────────────────────────────────────────────
install_mongodb() {
  log_step "STEP 4: Install MongoDB 8 (Ubuntu 24.04 Noble)"

  if command -v mongod &> /dev/null; then
    log_warning "MongoDB sudah terinstall, skip."
  else
    # Import MongoDB 8.0 GPG key
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
      sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

    # Tambahkan repository MongoDB 8.0 (Noble = Ubuntu 24.04)
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
      sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y mongodb-org
    log_success "MongoDB 8 terinstall."
  fi

  # Pastikan MongoDB berjalan
  sudo systemctl start mongod
  sudo systemctl enable mongod
  log_success "MongoDB berjalan dan diset auto-start."
}

# ─── STEP 5: SETUP DIREKTORI APLIKASI ─────────────────────────────────────────
setup_app_directory() {
  log_step "STEP 5: Setup Direktori Aplikasi"

  sudo mkdir -p "${APP_DIR}/backend"
  sudo mkdir -p "${APP_DIR}/frontend"
  sudo mkdir -p "${APP_DIR}/logs"
  sudo chown -R $USER:$USER "${APP_DIR}"

  log_success "Direktori ${APP_DIR} siap."
}

# ─── STEP 6: DEPLOY BACKEND ───────────────────────────────────────────────────
deploy_backend() {
  log_step "STEP 6: Deploy Backend (Node.js + Express)"

  # Salin file backend ke server (jalankan dari root project)
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

  rsync -av --delete \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='uploads' \
    "${PROJECT_ROOT}/backend/" "${APP_DIR}/backend/"

  # Buat file .env untuk production
  cat > "${APP_DIR}/backend/.env" <<ENVFILE
PORT=${BACKEND_PORT}
MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
NODE_ENV=${NODE_ENV}
FRONTEND_URL=https://${DOMAIN}
UPLOAD_DIR=uploads
ENVFILE

  chmod 600 "${APP_DIR}/backend/.env"
  log_success "File .env production dibuat (mode 600)."

  # Buat folder uploads dengan permission yang benar
  mkdir -p "${APP_DIR}/backend/uploads"

  # Install dependensi production saja
  cd "${APP_DIR}/backend"
  npm install --omit=dev
  log_success "Backend siap."
}

# ─── STEP 7: BUILD & DEPLOY FRONTEND ──────────────────────────────────────────
deploy_frontend() {
  log_step "STEP 7: Build & Deploy Frontend (React + Vite)"

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

  # Salin source frontend
  rsync -av --delete \
    --exclude='node_modules' \
    --exclude='dist' \
    "${PROJECT_ROOT}/frontend/" "${APP_DIR}/frontend/"

  # Buat .env.production untuk Vite
  # Karena Nginx akan proxy /api ke backend, tidak perlu full URL
  cat > "${APP_DIR}/frontend/.env.production" <<ENVFILE
VITE_API_URL=
ENVFILE

  # Install semua deps (termasuk devDeps untuk build)
  cd "${APP_DIR}/frontend"
  npm install
  npm run build
  log_success "Frontend berhasil di-build."

  # Deploy hasil build ke web root
  sudo mkdir -p /var/www/html/${APP_NAME}
  sudo cp -r "${APP_DIR}/frontend/dist/." /var/www/html/${APP_NAME}/
  sudo chown -R www-data:www-data /var/www/html/${APP_NAME}
  log_success "Frontend di-deploy ke /var/www/html/${APP_NAME}/"
}

# ─── STEP 8: KONFIGURASI NGINX ────────────────────────────────────────────────
configure_nginx() {
  log_step "STEP 8: Konfigurasi Nginx"

  # Hapus konfigurasi default Nginx
  sudo rm -f /etc/nginx/sites-enabled/default

  # Buat konfigurasi Nginx (HTTP dulu, Certbot nanti yang tambahkan HTTPS)
  sudo tee /etc/nginx/sites-available/${APP_NAME} > /dev/null <<NGINXCONF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Maksimal ukuran file upload
    client_max_body_size 20M;

    # Frontend: serve React build (static files)
    root /var/www/html/${APP_NAME};
    index index.html;

    # SPA fallback: semua route ke index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API: proxy ke Express
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Uploads: proxy ke Express
    location /uploads/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml application/json application/javascript text/javascript application/xml+rss;
}
NGINXCONF

  # Aktifkan konfigurasi
  sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/${APP_NAME}

  # Test dan reload Nginx
  sudo nginx -t
  sudo systemctl reload nginx
  log_success "Nginx dikonfigurasi dan direload."
}

# ─── STEP 9: FIREWALL (UFW) ───────────────────────────────────────────────────
configure_firewall() {
  log_step "STEP 9: Konfigurasi Firewall (UFW)"

  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw --force enable
  log_success "Firewall aktif. SSH, HTTP (80), HTTPS (443) dibuka."
  sudo ufw status
}

# ─── STEP 10: SSL CERTIFICATE (Let's Encrypt) ─────────────────────────────────
setup_ssl() {
  log_step "STEP 10: Setup SSL Certificate HTTPS (Let's Encrypt)"

  log_info "Meminta certificate untuk ${DOMAIN} dan www.${DOMAIN}..."

  sudo certbot --nginx \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --email "${ADMIN_EMAIL}" \
    --redirect

  # Aktifkan auto-renewal
  sudo systemctl enable certbot.timer
  sudo systemctl start certbot.timer
  log_success "SSL certificate terpasang! HTTPS aktif."
  log_info "Certificate akan diperbarui otomatis setiap 90 hari."
}

# ─── STEP 11: JALANKAN BACKEND DENGAN PM2 ─────────────────────────────────────
start_backend() {
  log_step "STEP 11: Menjalankan Backend dengan PM2"

  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  cd "${APP_DIR}/backend"

  # Stop proses lama jika ada
  pm2 delete ${APP_NAME} 2>/dev/null || true

  # Mulai proses baru
  pm2 start server.js \
    --name "${APP_NAME}" \
    --max-memory-restart 400M \
    --log "${APP_DIR}/logs/app.log" \
    --time

  # Simpan daftar proses PM2
  pm2 save

  # Setup auto-start saat VPS reboot
  pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null | grep "sudo" | bash 2>/dev/null || \
    pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

  log_success "Backend berjalan di port ${BACKEND_PORT}."
  pm2 status
}

# ─── VERIFIKASI AKHIR ─────────────────────────────────────────────────────────
verify_deployment() {
  log_step "VERIFIKASI DEPLOYMENT"

  sleep 5  # Tunggu backend fully started

  HEALTH_CHECK=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health" 2>/dev/null || echo "000")

  if [ "$HEALTH_CHECK" = "200" ]; then
    log_success "Health check OK (HTTP $HEALTH_CHECK)"
  else
    log_warning "Health check HTTP ${HEALTH_CHECK} — cek log: pm2 logs ${APP_NAME}"
  fi

  echo ""
  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}   DEPLOYMENT SELESAI!                          ${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo -e " URL        : https://${DOMAIN}"
  echo -e " API Health : https://${DOMAIN}/api/health"
  echo -e " PM2 Status : pm2 status"
  echo -e " PM2 Logs   : pm2 logs ${APP_NAME}"
  echo -e " Nginx Log  : sudo tail -f /var/log/nginx/error.log"
  echo -e " App Log    : tail -f ${APP_DIR}/logs/app.log"
  echo -e "${GREEN}================================================${NC}"
}

# ─── MAIN ─────────────────────────────────────────────────────────────────────
main() {
  echo -e "${CYAN}================================================${NC}"
  echo -e "${CYAN}  Web Rekapan GO - Auto Deployment Script       ${NC}"
  echo -e "${CYAN}================================================${NC}"
  echo ""

  validate_config
  setup_swap
  install_system_deps
  install_nodejs
  install_mongodb
  setup_app_directory
  deploy_backend
  deploy_frontend
  configure_nginx
  configure_firewall
  setup_ssl
  start_backend
  verify_deployment
}

main "$@"
