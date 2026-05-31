import { useState } from "react";
import CompressPage from "./pages/CompressPage";
import ComparePage from "./pages/ComparePage";

export default function App() {
  const [page, setPage] = useState("compress");

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative">
      {/* Arka plan parıltı */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] animate-pulse-slow" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/8">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => setPage("compress")}
            className="font-extrabold text-base tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400 hover:from-violet-300 hover:to-blue-300 transition-all duration-200"
          >
            Paralel Sıkıştırma
          </button>

          {/* İki ayrı buton - sağa dayalı */}
          <nav className="flex items-center gap-3">
            <NavBtn active={page === "compress"} onClick={() => setPage("compress")}>
              Sıkıştır
            </NavBtn>
            <NavBtn active={page === "compare"} onClick={() => setPage("compare")}>
              Karşılaştır
            </NavBtn>
          </nav>
        </div>
      </header>

      {/* İçerik — tam yükseklik, dikey ortalı */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full">
          {page === "compress" ? <CompressPage /> : <ComparePage />}
        </div>
      </main>
    </div>
  );
}

function NavBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-250 ${
        active
          ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-900/50 scale-[1.03]"
          : "text-slate-400 hover:text-slate-100 hover:bg-white/8 border border-white/10"
      }`}
    >
      {children}
    </button>
  );
}
