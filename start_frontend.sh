#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"

cd "$ROOT_DIR"

if [ ! -d "node_modules" ]; then
  echo "[Frontend] Installing dependencies..."
  npm install
fi

echo "[Frontend] Building..."
npm run build

echo "[Frontend] Serving dist on :${PORT}"
cd "$ROOT_DIR/dist"
exec python3 -m http.server "$PORT"
