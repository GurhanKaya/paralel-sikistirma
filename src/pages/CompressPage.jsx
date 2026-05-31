import { useState } from "react";
import Dropzone from "../components/Dropzone";
import { downloadBase64, formatBytes, formatTime } from "../lib/download";

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
      if (!res.ok) throw new Error(data.error || "Sıkıştırma başarısız");
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
            Dosyanı Paralel Sıkıştır
          </span>
        </h1>
        <p className="text-slate-400 text-lg">
          Dosyanı yükle, paralel worker'larla saniyeler içinde sıkıştırılsın ve indir.
        </p>
      </div>

      <div className="bg-slate-900/60 rounded-3xl shadow-2xl shadow-black/40 p-6 md:p-8 border border-white/10 backdrop-blur">
        {!result ? (
          <>
            <Dropzone file={file} onFile={setFile} disabled={loading} />
            <button
              onClick={compress}
              disabled={!file || loading}
              className="mt-5 w-full py-4 rounded-2xl font-semibold text-lg text-white transition-all duration-200
                bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500
                disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3"><Spinner /> Paralel sıkıştırılıyor...</span>
              ) : ("⚡ Sıkıştır")}
            </button>
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}
          </>
        ) : (
          <SuccessResult result={result} onReset={reset} />
        )}
      </div>

      <p className="text-center text-slate-500 text-xs mt-6">
        İşlem Vercel sunucusunda gerçek <strong className="text-slate-400">zlib/gzip</strong> ile yapılır ·{" "}
        İndirilen <strong className="text-slate-400">.gz</strong> dosyası 7-Zip/WinRAR ile açılabilir
      </p>
    </div>
  );
}

function SuccessResult({ result, onReset }) {
  return (
    <div className="text-center animate-fade-in">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-slate-100 mb-1">Sıkıştırma tamamlandı!</h2>
      <p className="text-slate-400 mb-6">
        <strong className="text-violet-400">{formatTime(result.parallel_time)}</strong> içinde,{" "}
        <strong className="text-slate-200">{result.workers} paralel worker</strong> ile sıkıştırıldı
      </p>

      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-slate-500 text-xs uppercase tracking-wide">Önce</div>
          <div className="text-2xl font-bold text-slate-200">{formatBytes(result.original_bytes)}</div>
        </div>
        <div className="text-3xl text-slate-600">→</div>
        <div className="text-center">
          <div className="text-slate-500 text-xs uppercase tracking-wide">Sonra</div>
          <div className="text-2xl font-bold text-emerald-400">{formatBytes(result.compressed_bytes)}</div>
        </div>
      </div>

      <div className="inline-block px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
        <span className="text-emerald-400 font-bold text-lg">%{result.savings_pct} tasarruf</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
        <MiniStat label="Parça" value={result.chunk_count} />
        <MiniStat label="Worker" value={result.workers} />
        <MiniStat label="Parça boyutu" value={`${result.chunk_kb} KB`} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => downloadBase64(result.file_b64, result.filename)}
          className="flex-1 py-4 rounded-2xl font-semibold text-white text-lg
            bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500
            shadow-lg shadow-violet-900/40 transition-all"
        >
          ⬇ Sıkıştırılmış Dosyayı İndir
        </button>
        <button
          onClick={onReset}
          className="py-4 px-6 rounded-2xl font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          Yeni Dosya
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl py-3 px-2 border border-white/10">
      <div className="text-slate-100 font-bold text-lg">{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
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
