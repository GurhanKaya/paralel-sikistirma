import { useState } from "react";
import CompressPage from "./pages/CompressPage";
import ComparePage from "./pages/ComparePage";

export default function App() {
  const [page, setPage] = useState("compress");

  return (
    <div className="min-h-screen flex flex-col relative text-slate-100">
      {/* Animasyonlu arka plan orb'ları */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[8%] w-[42vw] h-[42vw] max-w-[620px] max-h-[620px] bg-violet-600/15 rounded-full blur-[130px] animate-float" />
        <div className="absolute bottom-[-15%] right-[8%] w-[42vw] h-[42vw] max-w-[620px] max-h-[620px] bg-blue-600/15 rounded-full blur-[130px] animate-float-slow" />
        <div className="absolute top-[40%] left-[45%] w-[28vw] h-[28vw] max-w-[420px] max-h-[420px] bg-fuchsia-600/10 rounded-full blur-[120px] animate-float" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => setPage("compress")}
            className="font-extrabold text-base sm:text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 animate-gradient hover:opacity-80 transition-opacity"
          >
            Paralel Sıkıştırma
          </button>

          {/* Segmented control — sağa dayalı, animasyonlu kayan gösterge */}
          <nav className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-1">
            <span
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg shadow-violet-900/40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: page === "compress" ? "translateX(0)" : "translateX(100%)" }}
            />
            <TabBtn active={page === "compress"} onClick={() => setPage("compress")}>Sıkıştır</TabBtn>
            <TabBtn active={page === "compare"} onClick={() => setPage("compare")}>Karşılaştır</TabBtn>
          </nav>
        </div>
      </header>

      {/* İÇERİK — yatay + dikey ortalı, garantili */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <div key={page} className="w-full max-w-lg animate-slide-up">
          {page === "compress" ? <CompressPage /> : <ComparePage />}
        </div>
      </main>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative z-10 px-5 sm:px-6 py-2 rounded-xl text-sm font-semibold transition-colors duration-300 ${
        active ? "text-white" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
