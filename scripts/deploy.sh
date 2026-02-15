#!/bin/bash
set -e

# Miriel Web Deploy Script
# Usage: ./scripts/deploy.sh

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"
LIVE_REPO="git@github.com:arkenstone-lab/miriel-live.git"

echo "=== Miriel Deploy ==="

# 1. Build
echo "[1/4] Building Expo Web..."
cd "$PROJECT_ROOT"
npx expo export --platform web

# 2. Fix Cloudflare Pages node_modules ignore
#    Cloudflare Pages skips node_modules/ dirs, so rename to vendor/
echo "[2/4] Fixing asset paths (node_modules → vendor)..."
if [ -d "$DIST_DIR/assets/node_modules" ]; then
  mv "$DIST_DIR/assets/node_modules" "$DIST_DIR/assets/vendor"
  # Update references in JS bundles and HTML files
  find "$DIST_DIR" -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" \) \
    -exec sed -i 's|/assets/node_modules/|/assets/vendor/|g' {} +
  echo "   Renamed node_modules → vendor and updated references"
fi

# 3. Prepare dist with git
echo "[3/4] Preparing deployment..."
cd "$DIST_DIR"
rm -rf .git
git init
git remote add origin "$LIVE_REPO"
git add -A
git commit -m "deploy: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# 4. Push
echo "[4/4] Pushing to miriel-live..."
git push --force origin main

echo ""
echo "=== Deploy complete ==="
echo "https://miriel.app"
