export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 px-4 text-center">
      {/* Gradient arka plan efekti */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-slate-400 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          BLM4241 — Paralel Hesaplama | 2026
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Paralel Dosya{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
            Sıkıştırma
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          Büyük dosyaları parçalara ayırıp her parçayı <strong className="text-white">paralel worker</strong> ile
          sıkıştıran Python uygulaması. Seri ve paralel işlemenin hız farkını
          gerçek zamanlı olarak karşılaştır.
        </p>

        {/* Hızlı istatistikler */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
          <Stat value="4.25x" label="Max Speedup" color="text-green-400" />
          <Stat value="4 MB" label="Chunk Boyutu" color="text-blue-400" />
          <Stat value="zlib" label="Algoritma" color="text-purple-400" />
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500">
          <span>Gürhan</span>
          <span>•</span>
          <span>Baran</span>
          <span>•</span>
          <span>Fatih</span>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, color }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-slate-500 text-xs mt-1">{label}</div>
    </div>
  );
}
