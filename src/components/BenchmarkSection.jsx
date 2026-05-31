import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { benchmarkData, systemInfo } from "../data/benchmarkData";

export default function BenchmarkSection() {
  return (
    <section id="benchmark" className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <span className="inline-block border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs rounded-full px-3 py-1 mb-3">
          ÖNCEKİ DENEY
        </span>
        <h2 className="text-3xl font-bold text-white mb-3">Benchmark Sonuçları</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          10 / 50 / 100 / 500 MB dosyalarda yapılan ölçümler — {systemInfo.cpuCores} çekirdekli CPU,{" "}
          {systemInfo.repeatCount} tekrar ortalaması
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <ChartCard title="Uçtan Uca: Seri vs Paralel Süre">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={benchmarkData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} unit="s" />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                formatter={(v, n) => [`${v}s`, n]}
              />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              <Bar dataKey="e2eSeri" name="Seri" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="e2eParalel" name="Paralel" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Speedup Oranı (Dosya Boyutuna Göre)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} unit="x" />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                formatter={(v, n) => [v ? `${v}x` : "—", n]}
              />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              <ReferenceLine y={1} stroke="#64748b" strokeDasharray="5 5" label={{ value: "1x (eşit)", fill: "#64748b", fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="e2eSpeedup"
                name="E2E Speedup"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#3b82f6" }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="pureSpeedup"
                name="Saf CPU Speedup"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#a855f7" }}
                strokeDasharray="5 5"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Özet tablo */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h3 className="text-white font-semibold">Detaylı Sonuç Tablosu</h3>
          <p className="text-slate-500 text-xs mt-1">
            Sistem: {systemInfo.cpuCores} çekirdek CPU · Algoritma: {systemInfo.algorithm} · Chunk: {systemInfo.chunkSize}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <Th>Dosya</Th>
                <Th>E2E Seri</Th>
                <Th>E2E Paralel</Th>
                <Th highlight>E2E Speedup</Th>
                <Th>Saf Seri</Th>
                <Th>Saf Paralel</Th>
                <Th highlight>Saf Speedup</Th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <Td bold>{row.label}</Td>
                  <Td>{row.e2eSeri}s</Td>
                  <Td>{row.e2eParalel}s</Td>
                  <Td>
                    <SpeedupBadge value={row.e2eSpeedup} />
                  </Td>
                  <Td>{row.pureSeri ?? "—"}s</Td>
                  <Td>{row.pureParalel ?? "—"}s</Td>
                  <Td>
                    {row.pureSpeedup ? <SpeedupBadge value={row.pureSpeedup} /> : <span className="text-slate-600">—</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 text-slate-500 text-xs border-t border-white/10">
          * 500 MB için saf mod atlatıldı: tüm chunk'ları belleğe yüklemek 8 GB RAM sistemde risk oluşturuyor (SAF_MOD_LIMIT_MB = 200 koruması)
        </div>
      </div>

      {/* Bulgular */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {findings.map((f, i) => (
          <FindingCard key={i} {...f} />
        ))}
      </div>
    </section>
  );
}

const findings = [
  {
    icon: "📈",
    title: "Speedup dosya boyutuyla artar",
    text: "Trend: 0.23x → 1.16x → 1.92x → 4.25x. İş yükü, process kurulum maliyetini amortize ettikçe paralel kazanır.",
  },
  {
    icon: "⚠️",
    title: "Küçük dosyada paralel zararlı",
    text: "10 MB'da paralel sürüm seriden 4 kat YAVAŞ. Sadece 3 chunk için 12 worker'ın kurulum maliyeti asıl işten büyük.",
  },
  {
    icon: "📐",
    title: "Amdahl Yasası pratikte",
    text: "4.25x speedup ve 12 çekirdekte P ≈ %85. İşin %15'i seri kalıyor (IPC, disk I/O, koordinasyon).",
  },
  {
    icon: "💽",
    title: "Disk I/O darboğazı görünür",
    text: "100 MB'da Saf=2.21x, E2E=1.92x. Fark, disk okumanın paralel işlemeyi sınırladığını gösteriyor.",
  },
];

function FindingCard({ icon, title, text }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-white font-medium text-sm mb-1">{title}</div>
      <div className="text-slate-400 text-xs leading-relaxed">{text}</div>
    </div>
  );
}

function SpeedupBadge({ value }) {
  const isGood = value >= 1;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
        isGood ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {value}x {isGood ? "✓" : "⚠"}
    </span>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

function Th({ children, highlight }) {
  return (
    <th className={`px-4 py-3 text-left font-medium ${highlight ? "text-blue-400" : "text-slate-400"}`}>
      {children}
    </th>
  );
}

function Td({ children, bold }) {
  return (
    <td className={`px-4 py-3 ${bold ? "text-white font-medium" : "text-slate-300"}`}>
      {children}
    </td>
  );
}
