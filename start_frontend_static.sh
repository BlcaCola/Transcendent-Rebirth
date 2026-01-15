#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"

cd "$SCRIPT_DIR"

if [ ! -d "dist" ]; then
  echo "[Frontend] dist 目录不存在，请先上传构建产物。"
  exit 1
fi

echo "[Frontend] Serving dist on :${PORT}"
exec python3 -m http.server "$PORT" --directory dist
