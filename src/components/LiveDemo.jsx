import { useState, useRef } from "react";
import ResultCard from "./ResultCard";

const MAX_MB = 3;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function LiveDemo() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  function handleFile(f) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError(`Dosya ${MAX_MB} MB'tan büyük olamaz (seçilen: ${(f.size / 1024 / 1024).toFixed(1)} MB)`);
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function compress() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/compress", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "API hatası");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="demo" className="max-w-4xl mx-auto px-4 py-16">
      <SectionHeader
        title="Canlı Demo"
        subtitle="Dosyanı yükle, hem seri hem paralel sıkıştırma çalışsın — farkı gör"
        badge="CANLI"
        badgeColor="green"
      />

      {/* Dosya yükleme alanı */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragging
            ? "border-blue-400 bg-blue-500/10"
            : file
            ? "border-green-500/50 bg-green-500/5"
            : "border-white/10 hover:border-white/20 bg-white/3"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {file ? (
          <div>
            <div className="text-4xl mb-3">📄</div>
            <div className="text-white font-medium">{file.name}</div>
            <div className="text-slate-400 text-sm mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB — Sıkıştırmaya hazır
            </div>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">📂</div>
            <div className="text-white font-medium">Dosyayı buraya sürükle veya tıkla</div>
            <div className="text-slate-500 text-sm mt-2">Maksimum {MAX_MB} MB · Tüm dosya türleri</div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={compress}
        disabled={!file || loading}
        className="mt-4 w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200
          bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500
          text-white disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <Spinner />
            Seri + Paralel sıkıştırma çalışıyor...
          </span>
        ) : (
          "⚡ Seri & Paralel Sıkıştırmayı Başlat"
        )}
      </button>

      {/* Açıklama */}
      <p className="text-slate-500 text-xs text-center mt-2">
        Vercel cloud sunucusu her iki algoritmayı da çalıştırır ve sonuçları karşılaştırır
      </p>

      {/* Sonuçlar */}
      {result && <Results result={result} fileName={file?.name} />}
    </section>
  );
}

function Results({ result, fileName }) {
  const faster = result.serial_time < result.parallel_time ? "seri" : "paralel";

  return (
    <div className="mt-8 animate-fade-in">
      <div className="text-center mb-6">
        <span className="text-slate-400 text-sm">
          <strong className="text-white">{fileName}</strong> sıkıştırıldı
        </span>
      </div>

      {/* 4 ana kart */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ResultCard
          label="Seri Süre"
          value={result.serial_time < 0.01 ? "<0.01" : result.serial_time.toFixed(3)}
          unit="s"
          sub="Tek thread, sırayla"
          color="red"
          icon="🔴"
        />
        <ResultCard
          label="Paralel Süre"
          value={result.parallel_time < 0.01 ? "<0.01" : result.parallel_time.toFixed(3)}
          unit="s"
          sub={`${result.workers_used} worker, eş zamanlı`}
          color="green"
          icon="🟢"
        />
        <ResultCard
          label="Speedup"
          value={result.speedup.toFixed(2)}
          unit="x"
          sub={faster === "paralel" ? "Paralel daha hızlı" : "Seri daha hızlı"}
          color={result.speedup >= 1 ? "green" : "red"}
          icon={result.speedup >= 1 ? "⚡" : "⚠️"}
        />
        <ResultCard
          label="Tasarruf"
          value={result.savings_pct}
          unit="%"
          sub={`${result.original_mb} MB → ${result.compressed_mb} MB`}
          color="blue"
          icon="💾"
        />
      </div>

      {/* Detaylar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">İşlem Detayları</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Detail label="Chunk Sayısı" value={`${result.chunk_count} parça`} />
          <Detail label="Chunk Boyutu" value="4 MB" />
          <Detail label="Worker Sayısı" value={`${result.workers_used} thread`} />
          <Detail label="Algoritma" value="zlib seviye 6" />
        </div>

        {result.speedup < 1 && (
          <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs">
            ⚠️ <strong>Küçük dosyada beklenen sonuç:</strong> {result.chunk_count} chunk için{" "}
            {result.workers_used} worker başlatmanın overhead maliyeti, kazançtan büyük.
            Orijinal benchmark da aynı eğilimi gösteriyor: 10 MB dosyada speedup 0.23x.
            Büyük dosyalarda (50 MB+) paralel belirgin şekilde hızlanıyor.
          </div>
        )}
      </div>

      {/* Görsel bar karşılaştırma */}
      <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Süre Karşılaştırması</h3>
        <TimeBar label="Seri" time={result.serial_time} max={Math.max(result.serial_time, result.parallel_time)} color="bg-red-500" />
        <TimeBar label="Paralel" time={result.parallel_time} max={Math.max(result.serial_time, result.parallel_time)} color="bg-green-500" />
      </div>
    </div>
  );
}

function TimeBar({ label, time, max, color }) {
  const pct = max > 0 ? (time / max) * 100 : 100;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{time.toFixed(4)}s</span>
      </div>
      <div className="h-4 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="text-white font-mono mt-0.5">{value}</div>
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

function SectionHeader({ title, subtitle, badge, badgeColor }) {
  const colors = {
    green: "bg-green-500/10 border-green-500/30 text-green-400",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };
  return (
    <div className="text-center mb-10">
      {badge && (
        <span className={`inline-block border text-xs rounded-full px-3 py-1 mb-3 ${colors[badgeColor]}`}>
          {badge}
        </span>
      )}
      <h2 className="text-3xl font-bold text-white mb-3">{title}</h2>
      <p className="text-slate-400 max-w-xl mx-auto">{subtitle}</p>
    </div>
  );
}
