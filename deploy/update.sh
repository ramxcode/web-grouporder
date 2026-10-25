#!/bin/bash
# =============================================================================
#  WEB REKAPAN GO - Update Script (Re-Deploy)
#  Gunakan script ini saat ada perubahan kode tanpa setup ulang
#  Usage: bash update.sh [backend|frontend|all]
# =============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_step()    { echo -e "\n${CYAN}======================================${NC}"; echo -e "${CYAN} $1${NC}"; echo -e "${CYAN}======================================${NC}"; }

APP_NAME="web-rekapan-go"
APP_DIR="/var/www/${APP_NAME}"
BACKEND_PORT=5000
MODE="${1:-all}"  # all | backend | frontend

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

update_backend() {
  log_step "Update Backend"

  rsync -av --delete \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='uploads' \
    "${PROJECT_ROOT}/backend/" "${APP_DIR}/backend/"

  cd "${APP_DIR}/backend"
  npm install --omit=dev

  pm2 restart ${APP_NAME} --update-env
  log_success "Backend diupdate dan direstart."
  pm2 status
}

update_frontend() {
  log_step "Update Frontend"

  rsync -av --delete \
    --exclude='node_modules' \
    --exclude='dist' \
    "${PROJECT_ROOT}/frontend/" "${APP_DIR}/frontend/"

  cd "${APP_DIR}/frontend"
  npm install
  npm run build

  sudo cp -r "${APP_DIR}/frontend/dist/." /var/www/html/${APP_NAME}/
  sudo chown -R www-data:www-data /var/www/html/${APP_NAME}
  log_success "Frontend diupdate."
}

case "$MODE" in
  backend)
    update_backend
    ;;
  frontend)
    update_frontend
    ;;
  all|*)
    update_backend
    update_frontend
    ;;
esac

echo ""
log_success "Update selesai!"
echo -e " Gunakan: ${CYAN}pm2 logs ${APP_NAME}${NC} untuk cek log"
