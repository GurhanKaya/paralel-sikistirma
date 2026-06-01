"""
api/compress.py
---------------
Vercel serverless function — gerçek paralel/seri dosya sıkıştırma.

POST /api/compress?mode=parallel   → sadece paralel sıkıştır (Sayfa 1)
POST /api/compress?mode=compare    → seri + paralel ölç, karşılaştır (Sayfa 2)

ÖNEMLİ TASARIM NOTLARI:
- Multipart parse ELLE yapılır (cgi modülü Python 3.13'te kaldırıldı).
- Chunk boyutu ADAPTİF: dosya worker*4 civarı parçaya bölünür ki küçük
  dosyada bile paralellik görünsün (orijinal sabit 4 MB yerine).
- Her chunk bağımsız bir gzip "member" olarak sıkıştırılır; bunların
  birleşimi GEÇERLİ bir .gz dosyasıdır (7-Zip/gzip açar, orijinale döner).
- Süre ölçümü 3 tekrar ortalamasıdır (gürültüyü azaltmak için).
"""

import zlib
import gzip
import time
import json
import base64
import io
import os
import math
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

COMPRESS_LEVEL = 6                       # orijinal kodla aynı seviye
MAX_FILE = 10 * 1024 * 1024             # 10 MB üst sınır
REPEAT = 3                              # ölçüm tekrar sayısı (ortalama için)


# ─────────────────────────────────────────────────────────
#  Multipart/form-data parser (cgi kullanmadan)
# ─────────────────────────────────────────────────────────

def parse_multipart(body: bytes, content_type: str):
    """
    multipart/form-data gövdesinden ilk dosyayı çıkarır.
    Döndürür: (filename, file_bytes) veya (None, None)
    """
    # boundary'yi Content-Type başlığından al
    if "boundary=" not in content_type:
        return None, None
    boundary = content_type.split("boundary=")[1].strip()
    if boundary.startswith('"') and boundary.endswith('"'):
        boundary = boundary[1:-1]

    delimiter = ("--" + boundary).encode()

    # Gövdeyi parçalara böl
    parts = body.split(delimiter)
    for part in parts:
        if not part or part in (b"--\r\n", b"--", b"\r\n"):
            continue
        # Header ile gövde \r\n\r\n ile ayrılır
        if b"\r\n\r\n" not in part:
            continue
        raw_headers, _, content = part.partition(b"\r\n\r\n")
        headers = raw_headers.decode("utf-8", errors="ignore").lower()

        if "filename=" not in headers:
            continue  # bu bir dosya alanı değil

        # filename çıkar
        filename = "dosya"
        for line in raw_headers.decode("utf-8", errors="ignore").split("\r\n"):
            if "filename=" in line:
                try:
                    filename = line.split("filename=")[1].split('"')[1]
                except IndexError:
                    pass
                break

        # content sonundaki \r\n'i temizle
        if content.endswith(b"\r\n"):
            content = content[:-2]

        return (filename or "dosya"), content

    return None, None


# ─────────────────────────────────────────────────────────
#  Chunk planı + sıkıştırma
# ─────────────────────────────────────────────────────────

def plan_chunk_size(total: int, workers: int) -> int:
    """Adaptif chunk boyutu — küçük dosyada bile çok parça olsun."""
    target = max(workers * 4, 2)
    size = math.ceil(total / target)
    size = max(64 * 1024, min(4 * 1024 * 1024, size))  # 64 KB – 4 MB clamp
    return size


def split_chunks(data: bytes, chunk_size: int) -> list:
    chunks = [data[i:i + chunk_size] for i in range(0, len(data), chunk_size)]
    return chunks if chunks else [b""]


def gzip_chunk(chunk: bytes) -> bytes:
    """Tek chunk'ı bağımsız bir gzip member olarak sıkıştırır."""
    buf = io.BytesIO()
    # mtime=0 → deterministik çıktı (tekrarlarda aynı sonuç)
    with gzip.GzipFile(fileobj=buf, mode="wb",
                       compresslevel=COMPRESS_LEVEL, mtime=0) as g:
        g.write(chunk)
    return buf.getvalue()


def run_serial(chunks: list):
    """Sıralı sıkıştırma. Döndürür: (süre, sıkıştırılmış_chunk_listesi)"""
    t0 = time.perf_counter()
    results = [gzip_chunk(c) for c in chunks]
    elapsed = time.perf_counter() - t0
    return elapsed, results


def run_parallel(chunks: list, workers: int):
    """Paralel sıkıştırma (ThreadPoolExecutor). Döndürür: (süre, sonuçlar)"""
    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(gzip_chunk, chunks))
    elapsed = time.perf_counter() - t0
    return elapsed, results


def measure(fn, chunks, *args):
    """Bir ölçümü REPEAT kez çalıştırır, en iyi (min) süreyi döndürür."""
    best = None
    last_results = None
    for _ in range(REPEAT):
        elapsed, results = fn(chunks, *args)
        last_results = results
        if best is None or elapsed < best:
            best = elapsed
    return best, last_results


# ─────────────────────────────────────────────────────────
#  HTTP handler
# ─────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            qs = parse_qs(urlparse(self.path).query)
            mode = qs.get("mode", ["parallel"])[0]

            content_type = self.headers.get("Content-Type", "")
            length = int(self.headers.get("Content-Length", 0))

            if length > MAX_FILE + 1024 * 1024:
                self._err(413, "Dosya çok büyük (max 10 MB)")
                return

            body = self.rfile.read(length)
            filename, file_data = parse_multipart(body, content_type)

            if file_data is None:
                self._err(400, "Dosya okunamadı (multipart parse hatası)")
                return

            if len(file_data) == 0:
                self._err(400, "Dosya boş")
                return

            if len(file_data) > MAX_FILE:
                self._err(413, "Dosya çok büyük (max 10 MB)")
                return

            original_size = len(file_data)
            workers = min(os.cpu_count() or 2, 8)
            chunk_size = plan_chunk_size(original_size, workers)
            chunks = split_chunks(file_data, chunk_size)
            workers = min(workers, len(chunks))  # parça sayısından fazla worker gereksiz

            # Paralel her zaman çalışır (indirilecek dosya buradan üretilir)
            parallel_time, parallel_results = measure(run_parallel, chunks, workers)

            serial_time = None
            speedup = None
            if mode == "compare":
                serial_time, _ = measure(run_serial, chunks)
                speedup = (serial_time / parallel_time) if parallel_time > 0 else None

            # Sıkıştırılmış dosyayı birleştir (geçerli multi-member .gz)
            compressed = b"".join(parallel_results)
            compressed_size = len(compressed)
            ratio = compressed_size / original_size if original_size > 0 else 1.0

            result = {
                "filename": (filename or "dosya") + ".gz",
                "original_bytes": original_size,
                "compressed_bytes": compressed_size,
                "ratio": round(ratio, 4),
                "savings_pct": round((1 - ratio) * 100, 1),
                "parallel_time": round(parallel_time, 5),
                "serial_time": round(serial_time, 5) if serial_time is not None else None,
                "speedup": round(speedup, 3) if speedup is not None else None,
                "workers": workers,
                "chunk_count": len(chunks),
                "chunk_kb": round(chunk_size / 1024, 1),
                "file_b64": base64.b64encode(compressed).decode("ascii"),
            }

            self._json(200, result)

        except Exception as e:
            self._err(500, f"Sunucu hatası: {e}")

    # ── yardımcılar ──

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _err(self, code, msg):
        self._json(code, {"error": msg})

    def log_message(self, *args):
        pass
