import { useState, useRef } from "react";
import { formatBytes } from "../lib/download";

const MAX_MB = 4;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function Dropzone({ file, onFile, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  function pick(f) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError(`Dosya ${MAX_MB} MB'tan büyük olamaz (${formatBytes(f.size)})`);
      return;
    }
    if (f.size === 0) {
      setError("Dosya boş görünüyor, başka bir dosya seç.");
      return;
    }
    setError(null);
    onFile(f);
  }

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) pick(e.dataTransfer.files[0]); }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 md:p-14 text-center transition-all duration-200
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${dragging
            ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-500/40"
            : file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/15 hover:border-violet-400/60 bg-white/[0.02] hover:bg-violet-500/5"}`}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => pick(e.target.files[0])} disabled={disabled} />

        {file ? (
          <div>
            <div className="text-5xl mb-3">📄</div>
            <div className="text-slate-100 font-semibold text-lg break-all px-4">{file.name}</div>
            <div className="text-slate-400 text-sm mt-1">{formatBytes(file.size)} · Hazır</div>
            <div className="text-violet-400 text-xs mt-3 font-medium">Değiştirmek için tıkla</div>
          </div>
        ) : (
          <div>
            <div className="text-5xl mb-4">☁️</div>
            <div className="text-slate-200 font-semibold text-lg">Dosyayı buraya bırak veya tıkla</div>
            <div className="text-slate-500 text-sm mt-2">Maksimum {MAX_MB} MB · Tüm dosya türleri</div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
