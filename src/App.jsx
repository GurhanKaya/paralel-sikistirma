import { useState } from "react";
import CompressPage from "./pages/CompressPage";
import ComparePage from "./pages/ComparePage";

export default function App() {
  const [page, setPage] = useState("compress"); // "compress" | "compare"

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative">
      {/* Arka plan parıltı efektleri */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button onClick={() => setPage("compress")} className="flex items-center gap-2 font-extrabold text-lg shrink-0">
            <span className="text-xl">⚡</span>
            <span className="hidden sm:inline text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              Paralel Sıkıştırma
            </span>
          </button>

          {/* Segmented tab toggle */}
          <nav className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <Tab active={page === "compress"} onClick={() => setPage("compress")} icon="📦" label="Sıkıştır" />
            <Tab active={page === "compare"} onClick={() => setPage("compare")} icon="⚖" label="Karşılaştır" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {page === "compress" ? <CompressPage /> : <ComparePage />}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-slate-500 text-sm">
        <div className="mb-0.5">BLM4241 — Paralel Hesaplama · Gürhan • Baran • Fatih · 2026</div>
        <div className="text-xs">zlib/gzip · Python · React · Vercel</div>
      </footer>
    </div>
  );
}

function Tab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-900/40"
          : "text-slate-400 hover:text-slate-100"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
