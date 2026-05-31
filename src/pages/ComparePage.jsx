import { useState, useEffect } from "react";
import Dropzone from "../components/Dropzone";
import { downloadBase64, formatBytes, formatTime } from "../lib/download";
import { useCountUp } from "../lib/useCountUp";

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

  const reset = () => { setFile(null); setResult(null); setError(null); };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 animate-fade-in">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 animate-gradient">
            Seri vs Paralel
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed animate-fade-in delay-1">
          Aynı dosya hem seri hem paralel sıkıştırılır — gerçek süreler karşılaştırılır.
        </p>
      </div>

      <div className="relative animate-fade-in delay-2">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 rounded-[28px] blur opacity-20" />
        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-7 sm:p-9 space-y-6">
          {!result ? (
            <>
              <Dropzone file={file} onFile={setFile} disabled={loading} />

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <button
                onClick={run}
                disabled={!file || loading}
                className="shimmer relative overflow-hidden w-full py-4 rounded-2xl font-semibold text-base text-white
                  transition-all duration-300 bg-gradient-to-r from-violet-600 to-blue-600
                  hover:shadow-xl hover:shadow-violet-900/50 hover:-translate-y-0.5
                  disabled:opacity-35 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none
                  active:translate-y-0"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3"><Spinner /> Ölçülüyor...</span>
                ) : "Karşılaştır"}
              </button>
            </>
          ) : (
            <CompareResult result={result} onReset={reset} />
          )}
        </div>
      </div>

      <p className="text-center text-slate-600 text-xs mt-6 animate-fade-in delay-3">
        Her ölçüm 3 kez tekrarlanır, en hızlı süre alınır · Gerçek sunucu tarafı ölçüm
      </p>
    </div>
  );
}

function CompareResult({ result, onReset }) {
  const { serial_time, parallel_time, speedup } = result;
  const maxT = Math.max(serial_time || 0, parallel_time || 0) || 1;
  const parallelFaster = speedup != null && speedup >= 1;
  const speedupAnim = useCountUp(speedup ?? 0, 1000, 2);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 animate-fade-in">
        <p className="text-slate-300 text-sm font-medium break-all px-2">{result.filename.replace(/\.gz$/, "")}</p>
        <p className="text-slate-500 text-xs">
          {formatBytes(result.original_bytes)} · {result.chunk_count} parça · {result.workers} worker
        </p>
      </div>

      {/* Speedup — büyük count-up */}
      <div className="text-center animate-pop-in">
        <div className={`text-6xl font-extrabold ${parallelFaster ? "text-emerald-400" : "text-amber-400"}`}>
          {speedupAnim}x
        </div>
        <div className="text-slate-500 text-sm mt-1">
          {parallelFaster ? "paralel hızlanma" : "paralel daha yavaş"}
        </div>
      </div>

      {/* Animasyonlu barlar */}
      <div className="space-y-4 bg-white/[0.03] rounded-2xl px-5 py-5 border border-white/8 animate-fade-in delay-1">
        <TimeBar label="Seri" sub="tek thread, sırayla" time={serial_time}
          pct={((serial_time || 0) / maxT) * 100}
          barColor="from-red-600 to-red-400" dotColor="bg-red-500" delay={150} />
        <TimeBar label="Paralel" sub={`${result.workers} worker, eş zamanlı`} time={parallel_time}
          pct={((parallel_time || 0) / maxT) * 100}
          barColor="from-emerald-600 to-emerald-400" dotColor="bg-emerald-500" delay={350} />
      </div>

      {/* Açıklama */}
      <div className={`px-5 py-4 rounded-2xl border text-sm leading-relaxed animate-fade-in delay-2 ${
        parallelFaster
          ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-300"
          : "bg-amber-500/8 border-amber-500/20 text-amber-300"
      }`}>
        {parallelFaster
          ? `${result.chunk_count} parça ${result.workers} worker'a dağıtıldı. zlib GIL'i bıraktığı için thread'ler gerçekten eş zamanlı çalıştı.`
          : `Bu dosya çok hızlı sıkıştı, thread başlatma maliyeti kazançtan büyük oldu. 1 MB+ ve sıkışabilir bir dosyada paralel belirgin şekilde öne geçer.`}
      </div>

      {/* Butonlar */}
      <div className="flex gap-3 animate-fade-in delay-3">
        <button
          onClick={() => downloadBase64(result.file_b64, result.filename)}
          className="shimmer relative overflow-hidden flex-1 min-w-0 py-3.5 rounded-2xl font-semibold text-white text-sm
            bg-gradient-to-r from-violet-600 to-blue-600 hover:shadow-xl hover:shadow-violet-900/50 hover:-translate-y-0.5
            transition-all duration-300 active:translate-y-0"
        >
          <span className="block truncate px-2">İndir · {result.filename}</span>
        </button>
        <button
          onClick={onReset}
          className="shrink-0 px-5 py-3.5 rounded-2xl font-medium text-slate-300 text-sm
            bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 hover:-translate-y-0.5"
        >
          Yeni
        </button>
      </div>
    </div>
  );
}

function TimeBar({ label, sub, time, pct, barColor, dotColor, delay }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.max(pct, 3)), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-slate-200 text-sm font-semibold shrink-0">{label}</span>
          <span className="text-slate-500 text-xs truncate">{sub}</span>
        </div>
        <span className="text-slate-100 font-mono font-semibold text-sm shrink-0">{formatTime(time)}</span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
          style={{ width: `${w}%` }}
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
