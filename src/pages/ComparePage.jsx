import { useState, useEffect } from "react";
import Dropzone from "../components/Dropzone";
import { Card, Spinner } from "../components/Card";
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
      if (!res.ok) throw new Error(data.error || "Karşılaştırma başarısız");
      setResult(data);
    } catch (e) {
      setError(e.message === "Failed to fetch"
        ? "Sunucuya ulaşılamadı. Backend çalışıyor mu? (npm run dev otomatik başlatır)"
        : e.message);
    } finally {
      setLoading(false);
    }
  }

  function clearResult() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <Dropzone file={file} onFile={(f) => { setFile(f); clearResult(); }} disabled={loading} />

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
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
      </Card>

      {result && (
        <div className="animate-slide-up">
          <Card>
            <CompareResult result={result} />
          </Card>
        </div>
      )}

      <p className="text-center text-slate-500 text-xs">
        Her ölçüm 3 kez tekrarlanır, en hızlı süre alınır · Gerçek sunucu tarafı ölçüm
      </p>
    </div>
  );
}

function CompareResult({ result }) {
  const { serial_time, parallel_time, speedup } = result;
  const maxT = Math.max(serial_time || 0, parallel_time || 0) || 1;
  const parallelFaster = speedup != null && speedup >= 1;
  const speedupAnim = useCountUp(speedup ?? 0, 1000, 2);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <p className="text-slate-300 text-sm font-medium break-all px-2">{result.filename.replace(/\.gz$/, "")}</p>
        <p className="text-slate-500 text-xs">
          {formatBytes(result.original_bytes)} · {result.chunk_count} parça · {result.workers} worker
        </p>
      </div>

      <div className="text-center">
        <div className={`text-6xl font-extrabold ${parallelFaster ? "text-emerald-400" : "text-amber-400"}`}>
          {speedupAnim}x
        </div>
        <div className="text-slate-500 text-sm mt-1">
          {parallelFaster ? "paralel hızlanma" : "paralel daha yavaş"}
        </div>
      </div>

      <div className="space-y-4 bg-white/[0.03] rounded-2xl px-5 py-5 border border-white/8">
        <TimeBar
          label="Seri" sub="tek thread, sırayla"
          time={serial_time} pct={((serial_time || 0) / maxT) * 100}
          barColor="from-red-600 to-red-400" dotColor="bg-red-500" delay={150}
        />
        <TimeBar
          label="Paralel" sub={`${result.workers} worker, eş zamanlı`}
          time={parallel_time} pct={((parallel_time || 0) / maxT) * 100}
          barColor="from-emerald-600 to-emerald-400" dotColor="bg-emerald-500" delay={350}
        />
      </div>

      <div className={`px-5 py-4 rounded-2xl border text-sm leading-relaxed ${
        parallelFaster
          ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-300"
          : "bg-amber-500/8 border-amber-500/20 text-amber-300"
      }`}>
        {parallelFaster
          ? `${result.chunk_count} parça ${result.workers} worker'a dağıtıldı. zlib GIL'i bıraktı, thread'ler gerçekten eş zamanlı çalıştı.`
          : `Bu dosya çok hızlı sıkıştı; thread başlatma maliyeti kazançtan büyük oldu. 1 MB+ ve sıkışabilir bir dosyada paralel belirgin şekilde öne geçer.`}
      </div>

      <button
        onClick={() => downloadBase64(result.file_b64, result.filename)}
        className="shimmer relative overflow-hidden w-full py-3.5 rounded-2xl font-semibold text-white text-sm
          bg-gradient-to-r from-violet-600 to-blue-600 hover:shadow-xl hover:shadow-violet-900/50 hover:-translate-y-0.5
          transition-all duration-300 active:translate-y-0"
      >
        <span className="block truncate px-2">İndir · {result.filename}</span>
      </button>
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
