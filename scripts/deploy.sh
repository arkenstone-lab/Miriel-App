#!/bin/bash
set -e

# Miriel Web Deploy Script
# Usage: ./scripts/deploy.sh

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
LIVE_REPO="git@github.com:arkenstone-lab/miriel-live.git"

echo "=== Miriel Deploy ==="

# 1. Build
echo "[1/3] Building Expo Web..."
cd "$PROJECT_ROOT"
npx expo export --platform web

# 2. Prepare dist with git
echo "[2/3] Preparing deployment..."
cd "$DIST_DIR"
rm -rf .git
git init
git remote add origin "$LIVE_REPO"
git add -A
git commit -m "deploy: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# 3. Push
echo "[3/3] Pushing to miriel-live..."
git push --force origin main

echo ""
echo "=== Deploy complete ==="
echo "https://miriel.app"
