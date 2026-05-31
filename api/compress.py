import zlib
import time
import os
import json
import cgi
import io
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler

CHUNK_SIZE = 4 * 1024 * 1024  # 4 MB — orijinal kodla aynı
COMPRESS_LEVEL = 6              # orijinal kodla aynı
MAX_FILE_SIZE = 3 * 1024 * 1024  # 3 MB Vercel limit


def split_chunks(data: bytes) -> list:
    chunks = []
    for i in range(0, len(data), CHUNK_SIZE):
        chunks.append(data[i:i + CHUNK_SIZE])
    return chunks if chunks else [data]


def compress_chunk(chunk: bytes) -> bytes:
    return zlib.compress(chunk, COMPRESS_LEVEL)


def run_serial(chunks: list) -> tuple:
    t0 = time.perf_counter()
    results = [compress_chunk(c) for c in chunks]
    elapsed = time.perf_counter() - t0
    return elapsed, results


def run_parallel(chunks: list, workers: int) -> tuple:
    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(compress_chunk, chunks))
    elapsed = time.perf_counter() - t0
    return elapsed, results


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors()
        self.end_headers()

    def do_POST(self):
        try:
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))

            if content_length > MAX_FILE_SIZE + 65536:
                self._error(413, "Dosya çok büyük (max 3 MB)")
                return

            body = self.rfile.read(content_length)

            # multipart/form-data parse
            environ = {
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": content_type,
                "CONTENT_LENGTH": str(len(body)),
            }
            form = cgi.FieldStorage(
                fp=io.BytesIO(body),
                environ=environ,
                keep_blank_values=True,
            )

            file_field = form.getvalue("file")
            if file_field is None:
                self._error(400, "Dosya bulunamadı (field: 'file')")
                return

            if isinstance(file_field, str):
                file_data = file_field.encode("utf-8")
            else:
                file_data = bytes(file_field)

            if len(file_data) > MAX_FILE_SIZE:
                self._error(413, "Dosya çok büyük (max 3 MB)")
                return

            original_size = len(file_data)
            chunks = split_chunks(file_data)
            workers = min(os.cpu_count() or 2, len(chunks), 8)

            serial_time, serial_results = run_serial(chunks)
            parallel_time, parallel_results = run_parallel(chunks, workers)

            compressed_size = sum(len(r) for r in serial_results)
            ratio = compressed_size / original_size if original_size > 0 else 1.0
            speedup = serial_time / parallel_time if parallel_time > 0 else 1.0

            result = {
                "serial_time": round(serial_time, 4),
                "parallel_time": round(parallel_time, 4),
                "speedup": round(speedup, 3),
                "workers_used": workers,
                "chunk_count": len(chunks),
                "original_mb": round(original_size / (1024 * 1024), 3),
                "compressed_mb": round(compressed_size / (1024 * 1024), 3),
                "ratio": round(ratio, 3),
                "savings_pct": round((1 - ratio) * 100, 1),
            }

            self._json(200, result)

        except Exception as e:
            self._error(500, str(e))

    def _set_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, data: dict):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self._set_cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _error(self, code: int, msg: str):
        self._json(code, {"error": msg})

    def log_message(self, format, *args):
        pass  # Vercel loglarını temiz tut
