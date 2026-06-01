#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== EchoVoice — Installation système ==="

# 1. Build
cd "$SCRIPT_DIR"
bun install
bun run build

# 2. Config dir
mkdir -p ~/.config/echovoice

# 3. Icône
mkdir -p ~/.local/share/icons/hicolor/256x256/apps
cp "$SCRIPT_DIR/resources/tray-icon.png" ~/.local/share/icons/hicolor/256x256/apps/echovoice.png
# Fallback flat path pour les lanceurs simples
cp "$SCRIPT_DIR/resources/tray-icon.png" ~/.local/share/icons/echovoice.png

# 4. Wrapper script — c'est lui que .desktop appelle
cat > "$SCRIPT_DIR/echovoice-launch.sh" << 'LAUNCH'
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
electron "$SCRIPT_DIR/out/main/index.js"
LAUNCH
chmod +x "$SCRIPT_DIR/echovoice-launch.sh"

# 5. .desktop file
cat > ~/.local/share/applications/echovoice.desktop << DESKTOP
[Desktop Entry]
Name=EchoVoice
GenericName=Speech to Text
Comment=Overlay de transcription vocale — Groq Whisper
Exec=${SCRIPT_DIR}/echovoice-launch.sh
Icon=echovoice
Terminal=false
Type=Application
Categories=Utility;AudioVideo;Accessibility;
Keywords=speech;voice;transcription;whisper;dictée;micro;
StartupWMClass=echovoice
X-GNOME-Autostart-enabled=false
DESKTOP

# 6. Update desktop DB
update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
gtk-update-icon-cache ~/.local/share/icons/hicolor 2>/dev/null || true

echo ""
echo "✓ EchoVoice installé !"
echo "  → Cherche 'EchoVoice' dans rofi / wofi / KRunner / GNOME launcher"
echo "  → Hotkey global : Ctrl+Shift+Space (toggle overlay)"
echo "  → Clé API : lance l'app → ⚙ → entre ta Groq API key"
echo ""
echo "  Dev : bash start-dev.sh"
