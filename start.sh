#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.echovoice.pid"
HOTKEY_PID_FILE="$SCRIPT_DIR/.hotkey-daemon.pid"
LOG_DIR="$SCRIPT_DIR/logs"

mkdir -p "$LOG_DIR"
> "$LOG_DIR/app.log"
> "$LOG_DIR/hotkey.log"

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "EchoVoice already running (PID $OLD_PID). Run stop.sh first."
    exit 1
  fi
fi

cd "$SCRIPT_DIR"

if [ -z "$GROQ_API_KEY" ] && [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Start hotkey daemon (evdev, Wayland-compatible)
"$SCRIPT_DIR/.venv/bin/python3" "$SCRIPT_DIR/hotkey-daemon.py" > "$LOG_DIR/hotkey.log" 2>&1 &
echo $! > "$HOTKEY_PID_FILE"
echo "Hotkey daemon started (PID $(cat "$HOTKEY_PID_FILE")) — Ctrl+Shift+Space"

# Start Electron app
bun run dev > "$LOG_DIR/app.log" 2>&1 &
echo $! > "$PID_FILE"
echo "EchoVoice started (PID $(cat "$PID_FILE")). Logs: $LOG_DIR/app.log"
