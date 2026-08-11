#!/usr/bin/env python3
"""Static server for Terminal Teacher with no-cache headers.

Browsers aggressively cache JS modules served without cache headers, which
makes students see stale code after an update. `no-cache` forces a quick
revalidation (304 when unchanged) so updates always show up on reload.

Usage: python3 serve.py [port]
"""
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("", PORT), NoCacheHandler).serve_forever()
