export default function HowItWorks() {
  return (
    <section id="how" className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <span className="inline-block border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs rounded-full px-3 py-1 mb-3">
          MİMARİ
        </span>
        <h2 className="text-3xl font-bold text-white mb-3">Nasıl Çalışır?</h2>
        <p className="text-slate-400">Offset-based chunking ile paralel sıkıştırma mimarisi</p>
      </div>

      {/* Akış diyagramı */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-white font-semibold mb-6 text-center">Sıkıştırma Akışı</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <FlowStep icon="📄" title="Dosya" sub="Orijinal büyük dosya" />
          <Arrow />
          <FlowStep icon="✂️" title="Chunker" sub="Offset planı çıkar (okumadan)" color="blue" />
          <Arrow />
          <FlowStep icon="⚙️" title="Worker Pool" sub="Her chunk bağımsız sıkıştırılır" color="green" />
          <Arrow />
          <FlowStep icon="📦" title=".bin Dosya" sub="PCMP formatında birleştirir" color="purple" />
        </div>
      </div>

      {/* İki sütun açıklamalar */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <ExplainCard
          title="Offset-Based Chunking"
          icon="🔍"
          points={[
            "Dosya önce OKUNMAZ, sadece plan çıkarılır",
            "Plan: [(chunk_id, offset, length), ...]",
            "Worker'a küçük tuple gönderilir (büyük veri değil)",
            "Her worker kendi parçasını diskten okur",
            "IPC (inter-process communication) maliyeti minimal",
          ]}
        />
        <ExplainCard
          title="Paralel vs Seri Fark"
          icon="⚡"
          points={[
            "Seri: chunk_1 → chunk_2 → chunk_3 → ... (sırayla)",
            "Paralel: chunk_1, chunk_2, chunk_3 ... (aynı anda)",
            "zlib GIL'i release eder → thread'ler gerçek paralel",
            "Küçük dosyada overhead > kazanç (paralel yavaş)",
            "Büyük dosyada iş yükü domine eder (paralel hızlı)",
          ]}
        />
      </div>

      {/* Teknoloji tablosu */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Kullanılan Teknolojiler</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {techs.map((t, i) => (
            <TechRow key={i} {...t} />
          ))}
        </div>
      </div>

      {/* Amdahl Yasası */}
      <div className="mt-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-2">📐 Amdahl Yasası</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-3">
          Teorik maksimum hızlanma, işin paraleleştirilebilir oranıyla sınırlıdır:
        </p>
        <div className="font-mono text-blue-300 text-sm bg-black/30 rounded-lg p-3 mb-3">
          Speedup = 1 / ((1 - P) + P/N)
        </div>
        <p className="text-slate-400 text-xs">
          N=12 çekirdek, en iyi sonuç 4.25x → P ≈ %85.{" "}
          İşin <strong className="text-white">%15'i seri kalıyor</strong> (process kurulumu, disk I/O, koordinasyon).
          Teorik ideal 12x'e ulaşmak imkansız.
        </p>
      </div>
    </section>
  );
}

const techs = [
  { name: "Python 3.10+", role: "Ana dil", why: "Standart kütüphane yeterli" },
  { name: "multiprocessing.Pool", role: "Paralel işleme", why: "GIL'i bypass eder" },
  { name: "zlib (DEFLATE)", role: "Sıkıştırma", why: "Built-in, hızlı, seviye 6" },
  { name: "ThreadPoolExecutor", role: "Web'de paralel", why: "Serverless'ta fork() yok" },
  { name: "React + Vite", role: "Frontend", why: "Hızlı build, modern UI" },
  { name: "Recharts", role: "Grafikler", why: "React native, animasyonlu" },
];

function TechRow({ name, role, why }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
      <div>
        <span className="text-white font-mono text-sm">{name}</span>
        <span className="text-slate-500 text-xs ml-2">{role}</span>
        <div className="text-slate-500 text-xs mt-0.5">{why}</div>
      </div>
    </div>
  );
}

function ExplainCard({ title, icon, points }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-slate-400 text-sm">
            <span className="text-blue-400 flex-shrink-0">→</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlowStep({ icon, title, sub, color }) {
  const borderColor = {
    blue: "border-blue-500/30 bg-blue-500/5",
    green: "border-green-500/30 bg-green-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
  }[color] || "border-white/10 bg-white/5";

  return (
    <div className={`border rounded-xl p-4 text-center w-full md:w-36 ${borderColor}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-slate-500 text-xs mt-1">{sub}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="text-slate-600 text-2xl rotate-90 md:rotate-0 flex-shrink-0">→</div>
  );
}
