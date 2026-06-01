#!/usr/bin/env python3
"""
Hotkey daemon — listens for Ctrl+Shift+Space on all keyboards via evdev.
Sends 'toggle\n' to the Electron app via Unix socket /tmp/echovoice.sock.
Runs independently of Wayland/X11 compositor.
"""
import asyncio
import socket
import os
import sys
import time
from evdev import InputDevice, ecodes, list_devices
from loguru import logger

SOCKET_PATH = '/tmp/echovoice.sock'
HOTKEY = {ecodes.KEY_LEFTCTRL, ecodes.KEY_LEFTSHIFT, ecodes.KEY_SPACE}
HOTKEY_ALT = {ecodes.KEY_RIGHTCTRL, ecodes.KEY_RIGHTSHIFT, ecodes.KEY_SPACE}
DEBOUNCE_MS = 300

logger.remove()
logger.add(sys.stderr, format="<green>{time:HH:mm:ss}</green> {message}", level="INFO")

_last_toggle_ts: float = 0.0


def send_toggle() -> None:
    global _last_toggle_ts
    now = time.monotonic()
    if (now - _last_toggle_ts) * 1000 < DEBOUNCE_MS:
        return
    _last_toggle_ts = now
    try:
        with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
            s.connect(SOCKET_PATH)
            s.sendall(b'toggle\n')
        logger.info("toggle sent")
    except Exception as e:
        logger.warning(f"socket error: {e}")


def get_keyboard_devices() -> list[InputDevice]:
    devices = []
    for path in list_devices():
        try:
            d = InputDevice(path)
            caps = d.capabilities()
            if ecodes.EV_KEY in caps and ecodes.KEY_SPACE in caps[ecodes.EV_KEY]:
                # Skip virtual/audio devices
                if any(skip in d.name.lower() for skip in ['audio', 'hdmi', 'speaker', 'mic', 'passthrough', 'ydotool']):
                    continue
                devices.append(d)
                logger.info(f"monitoring: {d.path} — {d.name}")
        except Exception:
            pass
    return devices


async def monitor_device(device: InputDevice, pressed: set) -> None:
    try:
        async for event in device.async_read_loop():
            if event.type != ecodes.EV_KEY:
                continue
            if event.value == 1:  # key down
                pressed.add(event.code)
            elif event.value == 0:  # key up
                pressed.discard(event.code)

            if event.value == 1:  # trigger on keydown
                if HOTKEY.issubset(pressed) or HOTKEY_ALT.issubset(pressed):
                    send_toggle()
    except OSError:
        logger.warning(f"device disconnected: {device.path}")


async def main() -> None:
    logger.info(f"NexusVoice hotkey daemon — Ctrl+Shift+Space → {SOCKET_PATH}")

    devices = get_keyboard_devices()
    if not devices:
        logger.error("No keyboard devices found. Are you in the 'input' group?")
        sys.exit(1)

    # Shared pressed-keys set per device (each device tracks independently)
    tasks = [monitor_device(d, set()) for d in devices]
    await asyncio.gather(*tasks)


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("daemon stopped")
