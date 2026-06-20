#!/usr/bin/env python3
"""
Bouncy Castle Waiver — Local Server
=====================================
Run this script to serve the waiver form on your local network.
Parents scan the QR code with their phone to sign the waiver.

Usage:
    python3 start.py

No extra packages required — uses Python's built-in http.server.
"""

import http.server
import socket
import threading
import os
import sys
import time
import urllib.parse
import webbrowser

# ── Config ────────────────────────────────────────────────────
PORT   = 8080
WAIVER = "waiver.html"
QR_PAGE = "qr_display.html"

# ── Get local IP ─────────────────────────────────────────────
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()

# ── HTTP Server ───────────────────────────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        path = self.path.split('?')[0].split('#')[0]
        if WAIVER in path:
            print(f"  📋  Waiver accessed from {self.address_string()}")

def run_server(directory, port):
    os.chdir(directory)
    server = http.server.HTTPServer(("", port), Handler)
    server.serve_forever()

# ── Main ──────────────────────────────────────────────────────
def main():
    ip  = get_local_ip()
    waiver_url = f"http://{ip}:{PORT}/{WAIVER}"
    script_dir = os.path.dirname(os.path.abspath(__file__))

    print()
    print("=" * 54)
    print("  🏰  Bouncy Castle Waiver Server")
    print("=" * 54)
    print(f"\n  Network URL (for QR code):  {waiver_url}")
    print(f"  Local URL:   http://localhost:{PORT}/{WAIVER}")
    print()
    print("  ➡️  A browser window will open showing the QR code.")
    print("  ➡️  Parents scan it to open the waiver on their phone.")
    print("  ➡️  Press Ctrl+C to stop the server.\n")

    # Start server in background thread
    t = threading.Thread(target=run_server, args=(script_dir, PORT), daemon=True)
    t.start()
    time.sleep(0.4)

    # Open qr_display.html served by the local server, with URL in hash
    encoded = urllib.parse.quote(waiver_url, safe='')
    display_url = f"http://localhost:{PORT}/{QR_PAGE}#{encoded}"
    webbrowser.open(display_url)
    print(f"  Opened: {display_url}\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n  Server stopped. Have a great block party! 🎉\n")

if __name__ == "__main__":
    main()

