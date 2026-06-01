# Lokal geliştirme sunucusu — Vercel CLI'sız çalıştırmak için.
# compress.py'deki handler'i olduğu gibi localhost:8000'de servis eder.
# Vite (npm run dev) /api isteklerini buraya proxy'ler (bkz. vite.config.js).
#
# Çalıştırma:  python api/devserver.py
import os
import sys
from http.server import HTTPServer, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from compress import handler  # noqa: E402

PORT = 8000

if __name__ == "__main__":
    print(f"Backend hazir: http://localhost:{PORT}  (POST /api/compress)")
    print("Durdurmak icin: Ctrl+C")
    ThreadingHTTPServer(("localhost", PORT), handler).serve_forever()
