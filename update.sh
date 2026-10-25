#!/bin/bash

# ================================================================
# update.sh — Deploy update ke VPS via SCP + SSH
# Jalankan: bash update.sh
# ================================================================

VPS_IP="163.52.135.124"
VPS_PORT="22"
VPS_USER="root"
VPS_PATH="/var/www/web-zastiply"
VPS_STATIC="/var/www/html/web-zastiply"
PM2_NAME="web-zastiply"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}======================================${NC}"
echo -e "${CYAN}  Zastiply Deploy Update Script      ${NC}"
echo -e "${CYAN}======================================${NC}"
echo ""
echo -e "${YELLOW}Apa yang ingin diupdate?${NC}"
echo "  1) Frontend saja"
echo "  2) Backend saja"
echo "  3) Frontend + Backend"
echo ""
read -p "Pilih (1/2/3): " CHOICE
echo ""

# ── FRONTEND ──────────────────────────────────────────
upload_frontend() {
  echo -e "${CYAN}[Frontend] Upload files...${NC}"

  # Buat temp folder tanpa node_modules & dist
  TMPDIR_FE="./tmp_fe_upload"
  rm -rf "$TMPDIR_FE"
  mkdir -p "$TMPDIR_FE"

  # Copy hanya file yang diperlukan
  cp -r frontend/src       "$TMPDIR_FE/src"
  cp -r frontend/public    "$TMPDIR_FE/public"
  cp    frontend/index.html "$TMPDIR_FE/index.html"
  cp    frontend/package.json "$TMPDIR_FE/package.json"
  cp    frontend/vite.config.js "$TMPDIR_FE/vite.config.js" 2>/dev/null || true
  cp    frontend/vite.config.ts "$TMPDIR_FE/vite.config.ts" 2>/dev/null || true
  cp    frontend/.env.production "$TMPDIR_FE/.env.production" 2>/dev/null || true

  echo -e "${CYAN}[Frontend] SCP ke VPS...${NC}"
  scp -P $VPS_PORT -r "$TMPDIR_FE/." $VPS_USER@$VPS_IP:$VPS_PATH/frontend/

  if [ $? -ne 0 ]; then
    echo -e "${RED}Gagal upload frontend!${NC}"
    rm -rf "$TMPDIR_FE"
    exit 1
  fi

  rm -rf "$TMPDIR_FE"
  echo -e "${GREEN}Upload OK. Build di VPS...${NC}"

  ssh -p $VPS_PORT $VPS_USER@$VPS_IP "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
    set -e
    cd $VPS_PATH/frontend
    npm install --silent
    npm run build
    rm -rf $VPS_STATIC/*
    cp -r dist/* $VPS_STATIC/
    echo 'Frontend build selesai'
  "

  if [ $? -ne 0 ]; then
    echo -e "${RED}Build frontend gagal!${NC}"
    exit 1
  fi
  echo -e "${GREEN}[OK] Frontend selesai di-deploy.${NC}"
}

# ── BACKEND ───────────────────────────────────────────
upload_backend() {
  echo -e "${CYAN}[Backend] Upload files...${NC}"

  TMPDIR_BE="./tmp_be_upload"
  rm -rf "$TMPDIR_BE"
  mkdir -p "$TMPDIR_BE"

  # Copy folder backend kecuali node_modules & uploads
  for item in backend/*/; do
    name=$(basename "$item")
    if [ "$name" != "node_modules" ] && [ "$name" != "uploads" ]; then
      cp -r "$item" "$TMPDIR_BE/$name"
    fi
  done
  # Copy file root backend
  for f in backend/*.js backend/*.json; do
    [ -f "$f" ] && cp "$f" "$TMPDIR_BE/"
  done

  echo -e "${CYAN}[Backend] SCP ke VPS...${NC}"
  scp -P $VPS_PORT -r "$TMPDIR_BE/." $VPS_USER@$VPS_IP:$VPS_PATH/backend/

  if [ $? -ne 0 ]; then
    echo -e "${RED}Gagal upload backend!${NC}"
    rm -rf "$TMPDIR_BE"
    exit 1
  fi

  rm -rf "$TMPDIR_BE"
  echo -e "${GREEN}Upload OK. Restart PM2...${NC}"

  ssh -p $VPS_PORT $VPS_USER@$VPS_IP "
    export NVM_DIR=\"\$HOME/.nvm\"
    [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
    set -e
    cd $VPS_PATH/backend
    npm install --silent
    pm2 restart $PM2_NAME --update-env
    pm2 save
    echo 'Backend restart selesai'
  "

  if [ $? -ne 0 ]; then
    echo -e "${RED}Restart backend gagal!${NC}"
    exit 1
  fi
  echo -e "${GREEN}[OK] Backend selesai di-deploy.${NC}"
}

# ── EKSEKUSI ──────────────────────────────────────────
case $CHOICE in
  1) upload_frontend ;;
  2) upload_backend ;;
  3) upload_frontend; echo ""; upload_backend ;;
  *) echo -e "${RED}Pilihan tidak valid. Masukkan 1, 2, atau 3.${NC}"; exit 1 ;;
esac

echo ""
echo -e "${CYAN}======================================${NC}"
echo -e "${GREEN}  Deploy selesai!${NC}"
echo -e "${CYAN}======================================${NC}"
echo -e "  Website: ${CYAN}https://zastiply.web.id${NC}"
echo ""
