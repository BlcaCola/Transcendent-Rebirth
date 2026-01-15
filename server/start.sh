#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-12345}"

cd "$SCRIPT_DIR"

if [ ! -d "venv" ]; then
  echo "[Backend] Creating venv..."
  python3 -m venv venv
fi

# shellcheck disable=SC1091
source "$SCRIPT_DIR/venv/bin/activate"

if [ -f "requirements.txt" ]; then
  echo "[Backend] Installing requirements..."
  pip install -r requirements.txt
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "[Backend] Creating .env from .env.example"
  cp .env.example .env
fi

cd "$ROOT_DIR"

echo "[Backend] Starting on :${PORT}"
exec "$SCRIPT_DIR/venv/bin/python" -m uvicorn server.main:app --host 0.0.0.0 --port "$PORT"
