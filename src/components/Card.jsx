export function Card({ children }) {
  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 rounded-[28px] blur opacity-20" />
      <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-7 sm:p-8 space-y-5">
        {children}
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
