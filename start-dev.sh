#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
# Start hotkey daemon in background
.venv/bin/python3 hotkey-daemon.py &
DAEMON_PID=$!
trap "kill $DAEMON_PID 2>/dev/null" EXIT
# Start electron dev
bun run dev
