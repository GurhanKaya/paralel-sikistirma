export default function ResultCard({ label, value, unit, sub, color, icon }) {
  return (
    <div
      className={`bg-white/5 border rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
        color === "red"
          ? "border-red-500/30 hover:border-red-500/60"
          : color === "green"
          ? "border-green-500/30 hover:border-green-500/60"
          : color === "yellow"
          ? "border-yellow-500/30 hover:border-yellow-500/60"
          : "border-blue-500/30 hover:border-blue-500/60"
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-slate-400 text-sm mb-1">{label}</div>
      <div
        className={`text-3xl font-bold ${
          color === "red"
            ? "text-red-400"
            : color === "green"
            ? "text-green-400"
            : color === "yellow"
            ? "text-yellow-400"
            : "text-blue-400"
        }`}
      >
        {value}
        {unit && <span className="text-lg font-normal text-slate-500 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}
