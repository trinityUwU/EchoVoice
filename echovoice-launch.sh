#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Daemon hotkey en background (evdev, Wayland-compatible)
"$SCRIPT_DIR/.venv/bin/python3" "$SCRIPT_DIR/hotkey-daemon.py" &
DAEMON_PID=$!

cleanup() {
  kill "$DAEMON_PID" 2>/dev/null || true
  rm -f /tmp/echovoice.sock
}
trap cleanup EXIT

# Lance Electron avec le build prod
electron31 "$SCRIPT_DIR/out/main/index.js" --no-sandbox
