import { useState } from "react";
import Dropzone from "../components/Dropzone";
import { downloadBase64, formatBytes, formatTime } from "../lib/download";

export default function ComparePage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function run() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/compress?mode=compare", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Karşılaştırma başarısız");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
            Seri vs Paralel Karşılaştırma
          </span>
        </h1>
        <p className="text-slate-400 text-lg">
          Aynı dosya hem seri hem paralel sıkıştırılır, gerçek süreler ölçülür.
        </p>
      </div>

      <div className="bg-slate-900/60 rounded-3xl shadow-2xl shadow-black/40 p-6 md:p-8 border border-white/10 backdrop-blur">
        {!result ? (
          <>
            <Dropzone file={file} onFile={setFile} disabled={loading} />
            <button
              onClick={run}
              disabled={!file || loading}
              className="mt-5 w-full py-4 rounded-2xl font-semibold text-lg text-white transition-all duration-200
                bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500
                disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3"><Spinner /> Seri + Paralel ölçülüyor...</span>
              ) : ("⚖ Karşılaştırmayı Başlat")}
            </button>
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}
          </>
        ) : (
          <CompareResult result={result} onReset={reset} />
        )}
      </div>

      <p className="text-center text-slate-500 text-xs mt-6">
        Her ölçüm 3 kez çalıştırılıp en iyi süre alınır · Gerçek zamanlı, sunucu tarafı ölçüm
      </p>
    </div>
  );
}

function CompareResult({ result, onReset }) {
  const { serial_time, parallel_time, speedup } = result;
  const maxT = Math.max(serial_time || 0, parallel_time || 0) || 1;
  const parallelFaster = speedup != null && speedup >= 1;

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-slate-300 text-sm break-all">{result.filename.replace(/\.gz$/, "")}</div>
        <div className="text-slate-500 text-xs mt-1">
          {formatBytes(result.original_bytes)} · {result.chunk_count} parça · {result.workers} worker
        </div>
      </div>

      <div className="text-center mb-6">
        <div
          className={`inline-block px-6 py-3 rounded-2xl font-extrabold text-3xl border ${
            parallelFaster
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          {speedup != null ? `${speedup.toFixed(2)}x` : "—"}{" "}
          <span className="text-base font-medium">{parallelFaster ? "hızlanma" : "(paralel yavaş)"}</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <TimeBar label="🔴 Seri (tek thread)" time={serial_time}
          pct={((serial_time || 0) / maxT) * 100} color="bg-gradient-to-r from-red-500 to-red-400" />
        <TimeBar label="🟢 Paralel (çok worker)" time={parallel_time}
          pct={((parallel_time || 0) / maxT) * 100} color="bg-gradient-to-r from-emerald-500 to-green-400" />
      </div>

      {!parallelFaster && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm mb-6">
          ⚠️ <strong>Küçük/hızlı dosyada beklenen sonuç:</strong> Bu dosya {result.chunk_count} parçaya bölündü ve çok
          hızlı sıkıştı. Thread başlatma maliyeti, kazançtan büyük olabiliyor. Daha büyük (1 MB+) ve sıkışabilir bir
          dosyada paralel belirgin şekilde öne geçer.
        </div>
      )}
      {parallelFaster && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm mb-6">
          ✓ <strong>Paralel kazandı!</strong> {result.chunk_count} parça {result.workers} worker'a dağıtıldı; zlib
          GIL'i bıraktığı için thread'ler gerçekten eş zamanlı çalıştı.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => downloadBase64(result.file_b64, result.filename)}
          className="flex-1 py-3.5 rounded-2xl font-semibold text-white
            bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500
            shadow-lg shadow-violet-900/40 transition-all"
        >
          ⬇ Sıkıştırılmış Dosyayı İndir
        </button>
        <button
          onClick={onReset}
          className="py-3.5 px-6 rounded-2xl font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          Yeni Dosya
        </button>
      </div>
    </div>
  );
}

function TimeBar({ label, time, pct, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-100 font-mono font-semibold">{formatTime(time)}</span>
      </div>
      <div className="h-6 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
