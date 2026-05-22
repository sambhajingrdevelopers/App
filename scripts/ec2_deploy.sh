#!/usr/bin/env bash
set -e

APP_DIR="${APP_DIR:-$HOME/vibeloop-app}"
BACKEND_DIR="$APP_DIR/backend"
SERVICE_NAME="${SERVICE_NAME:-vibeloop-backend}"

echo "Starting VibeLoop EC2 production deploy..."
echo "App directory: $APP_DIR"

cd "$APP_DIR"

BK="_history/trash/ec2-deploy-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BK"

git status --short > "$BK/git-status.txt" || true
git diff > "$BK/local-diff.patch" || true
cp -a backend "$BK/backend-copy" 2>/dev/null || true

echo "Backup saved to: $BK"

git stash push -u -m "auto-backup-before-production-deploy-$(date +%Y%m%d-%H%M%S)" || true
git pull origin main

if [ -f "backend/tools/fix_routes.py" ]; then
  python3 backend/tools/fix_routes.py
fi

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

python -m py_compile main.py

echo "Restarting backend service..."
sudo systemctl daemon-reload
sudo systemctl restart "$SERVICE_NAME"
sleep 2
sudo systemctl status "$SERVICE_NAME" --no-pager

echo "Deploy complete."
