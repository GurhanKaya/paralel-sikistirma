import { useState } from "react";
import Dropzone from "../components/Dropzone";
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

  const reset = () => { setFile(null); setResult(null); setError(null); };

  return (
    <div className="w-full">
      {/* Başlık */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 animate-fade-in">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 animate-gradient">
            Paralel Sıkıştırma
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed animate-fade-in delay-1">
          Dosyanı yükle, paralel worker'larla sıkıştırılsın ve indir.
        </p>
      </div>

      {/* Gradient glow + kart */}
      <div className="relative animate-fade-in delay-2">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 rounded-[28px] blur opacity-20" />
        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-7 sm:p-9 space-y-6">
          {!result ? (
            <>
              <Dropzone file={file} onFile={setFile} disabled={loading} />

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
                  <span className="flex items-center justify-center gap-3"><Spinner /> Sıkıştırılıyor...</span>
                ) : "Sıkıştır"}
              </button>
            </>
          ) : (
            <SuccessResult result={result} onReset={reset} />
          )}
        </div>
      </div>

      <p className="text-center text-slate-600 text-xs mt-6 animate-fade-in delay-3">
        Vercel sunucusunda zlib/gzip ile sıkıştırılır · İndirilen .gz dosyası 7-Zip ile açılabilir
      </p>
    </div>
  );
}

function SuccessResult({ result, onReset }) {
  const savings = useCountUp(result.savings_pct, 900, 1);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 animate-pop-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-100">Sıkıştırma tamamlandı</h2>
        <p className="text-slate-400 text-sm">
          {formatTime(result.parallel_time)} · {result.workers} worker · {result.chunk_count} parça
        </p>
      </div>

      {/* Tasarruf vurgusu — büyük count-up */}
      <div className="text-center animate-fade-in delay-1">
        <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
          %{savings}
        </div>
        <div className="text-slate-500 text-sm mt-1">daha küçük</div>
      </div>

      {/* Boyut karşılaştırma */}
      <div className="flex items-center gap-4 bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/8 animate-fade-in delay-2">
        <div className="flex-1 text-center min-w-0">
          <p className="text-slate-500 text-[11px] uppercase tracking-widest mb-1">Orijinal</p>
          <p className="text-slate-200 font-bold text-lg truncate">{formatBytes(result.original_bytes)}</p>
        </div>
        <svg className="w-5 h-5 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <div className="flex-1 text-center min-w-0">
          <p className="text-slate-500 text-[11px] uppercase tracking-widest mb-1">Sıkıştırılmış</p>
          <p className="text-emerald-400 font-bold text-lg truncate">{formatBytes(result.compressed_bytes)}</p>
        </div>
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

function ErrorBox({ msg }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in">
      {msg}
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
