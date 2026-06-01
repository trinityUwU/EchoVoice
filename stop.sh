#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.echovoice.pid"
HOTKEY_PID_FILE="$SCRIPT_DIR/.hotkey-daemon.pid"

stop_pid() {
  local file=$1 label=$2
  if [ -f "$file" ]; then
    PID=$(cat "$file")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" && echo "$label stopped (PID $PID)."
    fi
    rm -f "$file"
  fi
}

stop_pid "$HOTKEY_PID_FILE" "Hotkey daemon"
stop_pid "$PID_FILE" "EchoVoice"
rm -f /tmp/echovoice.sock
