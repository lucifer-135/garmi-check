"""Local preview: serves frontend/ and runs the Lambda handler for /risk and /replay.

python scripts/dev_server.py   then open http://localhost:8000
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from app import handler  # noqa: E402


class DevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / "frontend"), **kwargs)

    def do_GET(self):
        parts = urlsplit(self.path)
        if parts.path in ("/risk", "/replay"):
            event = {"rawPath": parts.path, "queryStringParameters": dict(parse_qsl(parts.query)) or None}
            res = handler(event, None)
            body = res["body"].encode("utf-8")
            self.send_response(res["statusCode"])
            for k, v in res["headers"].items():
                self.send_header(k, v)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Garmi Check dev server on http://localhost:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), DevHandler).serve_forever()
