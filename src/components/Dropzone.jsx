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
      setError(`Dosya ${MAX_MB} MB'tan büyük olamaz (seçilen: ${formatBytes(f.size)})`);
      return;
    }
    if (f.size === 0) {
      setError("Dosya boş, lütfen başka bir dosya seç.");
      return;
    }
    setError(null);
    onFile(f);
  }

  return (
    <div className="w-full">
      <div
        onClick={() => !disabled && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) pick(e.dataTransfer.files[0]); }}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed py-10 px-6 text-center
          transition-all duration-300 overflow-hidden
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${dragging
            ? "border-violet-400 bg-violet-500/10 scale-[1.02]"
            : file
            ? "border-emerald-500/50 bg-emerald-500/[0.04]"
            : "border-white/15 hover:border-violet-400/60 bg-white/[0.02] hover:bg-violet-500/[0.04]"}`}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => pick(e.target.files[0])} disabled={disabled} />

        {file ? (
          <div className="space-y-2 animate-pop-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-100 font-semibold text-base break-all px-2">{file.name}</p>
            <p className="text-slate-400 text-sm">{formatBytes(file.size)}</p>
            <p className="text-violet-400 text-xs font-medium">Değiştirmek için tıkla</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center
              transition-transform duration-300 ${dragging ? "scale-110 -translate-y-1" : "group-hover:-translate-y-1"}`}>
              <svg className="w-7 h-7 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-slate-200 font-semibold text-base">
                {dragging ? "Bırak, yükleyelim" : "Dosyayı buraya bırak"}
              </p>
              <p className="text-slate-500 text-sm mt-1">veya tıklayarak seç</p>
            </div>
            <p className="text-slate-600 text-xs">Maksimum {MAX_MB} MB · Tüm dosya türleri</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
