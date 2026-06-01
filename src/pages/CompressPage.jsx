import { useState } from "react";
import Dropzone from "../components/Dropzone";
import { Card, Spinner } from "../components/Card";
import { downloadBase64, formatBytes, formatTime } from "../lib/download";
import { useCountUp } from "../lib/useCountUp";

export default function CompressPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function compress() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/compress?mode=parallel", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sikistirma basarisiz");
      setResult(data);
    } catch (e) {
      setError(e.message);
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

        {error && <ErrorBox msg={error} />}

        <button
          onClick={compress}
          disabled={!file || loading}
          className="shimmer relative overflow-hidden w-full py-4 rounded-2xl font-semibold text-base text-white
            transition-all duration-300 bg-gradient-to-r from-violet-600 to-blue-600
            hover:shadow-xl hover:shadow-violet-900/50 hover:-translate-y-0.5
            disabled:opacity-35 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none
            active:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3"><Spinner /> Sikistiriliyor...</span>
          ) : "Sikistir"}
        </button>
      </Card>

      {result && (
        <div className="animate-slide-up">
          <Card>
            <SuccessResult result={result} />
          </Card>
        </div>
      )}

      <p className="text-center text-slate-500 text-xs">
        Vercel sunucusunda zlib/gzip ile sikistirilir · Indirilen .gz dosyasi 7-Zip ile acilabilir
      </p>
    </div>
  );
}

function SuccessResult({ result }) {
  const savings = useCountUp(result.savings_pct, 900, 1);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-slate-300 text-sm font-medium">Sikistirma tamamlandi</p>
        <p className="text-slate-500 text-xs">
          {formatTime(result.parallel_time)} · {result.workers} worker · {result.chunk_count} parca
        </p>
      </div>

      <div className="text-center">
        <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
          %{savings}
        </div>
        <div className="text-slate-500 text-sm mt-1">daha kucuk</div>
      </div>

      <div className="flex items-center gap-4 bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/8">
        <div className="flex-1 text-center min-w-0">
          <p className="text-slate-500 text-[11px] uppercase tracking-widest mb-1">Orijinal</p>
          <p className="text-slate-200 font-bold text-lg truncate">{formatBytes(result.original_bytes)}</p>
        </div>
        <svg className="w-5 h-5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <div className="flex-1 text-center min-w-0">
          <p className="text-slate-500 text-[11px] uppercase tracking-widest mb-1">Sikistirilmis</p>
          <p className="text-emerald-400 font-bold text-lg truncate">{formatBytes(result.compressed_bytes)}</p>
        </div>
      </div>

      <button
        onClick={() => downloadBase64(result.file_b64, result.filename)}
        className="shimmer relative overflow-hidden w-full py-3.5 rounded-2xl font-semibold text-white text-sm
          bg-gradient-to-r from-violet-600 to-blue-600 hover:shadow-xl hover:shadow-violet-900/50 hover:-translate-y-0.5
          transition-all duration-300 active:translate-y-0"
      >
        <span className="block truncate px-2">Indir · {result.filename}</span>
      </button>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
      {msg}
    </div>
  );
}
