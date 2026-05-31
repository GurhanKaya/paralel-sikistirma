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
      if (!res.ok) throw new Error(data.error || "Karsilastirma basarisiz");
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
    <div className="max-w-xl mx-auto px-6">
      {/* Sayfa başlığı */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
            Seri vs Paralel
          </span>
        </h1>
        <p className="text-slate-400 text-base leading-relaxed">
          Aynı dosya hem seri hem paralel sıkıştırılır — gerçek süreler karşılaştırılır.
        </p>
      </div>

      {/* Ana kart */}
      <div className="bg-slate-900/50 rounded-3xl border border-white/10 backdrop-blur p-8 space-y-6 shadow-2xl shadow-black/30">
        {!result ? (
          <>
            <Dropzone file={file} onFile={setFile} disabled={loading} />

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={run}
              disabled={!file || loading}
              className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all duration-300
                bg-gradient-to-r from-violet-600 to-blue-600
                hover:from-violet-500 hover:to-blue-500 hover:shadow-lg hover:shadow-violet-900/40 hover:scale-[1.01]
                disabled:opacity-35 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none
                active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <Spinner /> Ölçülüyor...
                </span>
              ) : (
                "Karşılaştır"
              )}
            </button>
          </>
        ) : (
          <CompareResult result={result} onReset={reset} />
        )}
      </div>

      <p className="text-center text-slate-600 text-xs mt-6">
        Her ölçüm 3 kez tekrarlanır, en hızlı süre alınır · Gerçek sunucu tarafı ölçüm
      </p>
    </div>
  );
}

function CompareResult({ result, onReset }) {
  const { serial_time, parallel_time, speedup } = result;
  const maxT = Math.max(serial_time || 0, parallel_time || 0) || 1;
  const parallelFaster = speedup != null && speedup >= 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dosya bilgisi */}
      <div className="text-center space-y-1">
        <p className="text-slate-300 text-sm font-medium break-all">{result.filename.replace(/\.gz$/, "")}</p>
        <p className="text-slate-500 text-xs">
          {formatBytes(result.original_bytes)} · {result.chunk_count} parça · {result.workers} worker
        </p>
      </div>

      {/* Speedup rozeti */}
      <div className="text-center">
        <div
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-2xl border transition-all ${
            parallelFaster
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
              : "bg-amber-500/10 text-amber-400 border-amber-500/25"
          }`}
        >
          <span>{speedup != null ? `${speedup.toFixed(2)}x` : "—"}</span>
          <span className="text-sm font-medium text-current opacity-70">
            {parallelFaster ? "hızlanma" : "paralel yavaş"}
          </span>
        </div>
      </div>

      {/* Bar karşılaştırma */}
      <div className="space-y-4 bg-white/3 rounded-2xl px-6 py-5 border border-white/8">
        <TimeBar
          label="Seri"
          sub="tek thread, sırayla"
          time={serial_time}
          pct={((serial_time || 0) / maxT) * 100}
          barColor="bg-gradient-to-r from-red-600 to-red-400"
          dotColor="bg-red-500"
        />
        <TimeBar
          label="Paralel"
          sub={`${result.workers} worker, eş zamanlı`}
          time={parallel_time}
          pct={((parallel_time || 0) / maxT) * 100}
          barColor="bg-gradient-to-r from-emerald-600 to-emerald-400"
          dotColor="bg-emerald-500"
        />
      </div>

      {/* Açıklama */}
      <div
        className={`px-5 py-4 rounded-2xl border text-sm leading-relaxed ${
          parallelFaster
            ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-300"
            : "bg-amber-500/8 border-amber-500/20 text-amber-300"
        }`}
      >
        {parallelFaster
          ? `${result.chunk_count} parça ${result.workers} worker'a dağıtıldı. zlib GIL'i bıraktığı için thread'ler gerçekten eş zamanlı çalıştı.`
          : `Bu dosya çok hızlı sıkıştı. Thread başlatma maliyeti, kazançtan büyük oldu. 1 MB+ ve sıkışabilir bir dosyada paralel belirgin şekilde öne geçer.`}
      </div>

      {/* Butonlar */}
      <div className="flex gap-3">
        <button
          onClick={() => downloadBase64(result.file_b64, result.filename)}
          className="flex-1 py-3.5 rounded-2xl font-semibold text-white text-sm
            bg-gradient-to-r from-violet-600 to-blue-600
            hover:from-violet-500 hover:to-blue-500 hover:shadow-lg hover:shadow-violet-900/40 hover:scale-[1.01]
            transition-all duration-200 active:scale-[0.99]"
        >
          İndir  ·  {result.filename}
        </button>
        <button
          onClick={onReset}
          className="px-5 py-3.5 rounded-2xl font-medium text-slate-300 text-sm
            bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
        >
          Yeni
        </button>
      </div>
    </div>
  );
}

function TimeBar({ label, sub, time, pct, barColor, dotColor }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <div>
            <span className="text-slate-200 text-sm font-semibold">{label}</span>
            <span className="text-slate-500 text-xs ml-2">{sub}</span>
          </div>
        </div>
        <span className="text-slate-100 font-mono font-semibold text-sm">{formatTime(time)}</span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
