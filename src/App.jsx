import Hero from "./components/Hero";
import LiveDemo from "./components/LiveDemo";
import BenchmarkSection from "./components/BenchmarkSection";
import HowItWorks from "./components/HowItWorks";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-white text-sm">
            ⚡ <span className="text-blue-400">Paralel</span> Sıkıştırma
          </span>
          <div className="flex gap-6 text-sm text-slate-400">
            <NavLink href="#demo">Demo</NavLink>
            <NavLink href="#benchmark">Benchmark</NavLink>
            <NavLink href="#how">Mimari</NavLink>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <Hero />
      <Divider />
      <LiveDemo />
      <Divider />
      <BenchmarkSection />
      <Divider />
      <HowItWorks />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-600 text-sm">
        <div className="mb-1">BLM4241 — Paralel Hesaplama | Gürhan • Baran • Fatih | 2026</div>
        <div className="text-xs">zlib + multiprocessing.Pool · Python · React</div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }) {
  return (
    <a href={href} className="hover:text-white transition-colors">
      {children}
    </a>
  );
}

function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="border-t border-white/5" />
    </div>
  );
}
