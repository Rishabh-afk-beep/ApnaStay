import { useState } from "react";

export function SupportHub() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      {/* Expanded Support Card */}
      {isOpen && (
        <div
          className="w-[320px] rounded-3xl p-5 shadow-2xl animate-rise border"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderColor: "var(--glass-border)",
            boxShadow: "var(--shadow-ambient)",
            color: "var(--on-surface)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: "var(--outline-variant)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider">Support Hub</h4>
                <p className="text-[10px] opacity-70">NearMyColleges Premium Helpline</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-500/10 transition-colors"
              aria-label="Close support panel"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Helpline Items */}
          <div className="space-y-3.5">
            {/* Helpline 1 */}
            <div className="rounded-2xl p-3 border transition-colors hover:bg-slate-500/5" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-slate-400">Support Line 1</span>
                <span className="text-xs font-black">8152916235</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+918152916235"
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all"
                >
                  📞 Call
                </a>
                <a
                  href="https://wa.me/918152916235"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* Helpline 2 */}
            <div className="rounded-2xl p-3 border transition-colors hover:bg-slate-500/5" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-slate-400">Support Line 2</span>
                <span className="text-xs font-black">9002252480</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+919002252480"
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all"
                >
                  📞 Call
                </a>
                <a
                  href="https://wa.me/919002252480"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button with pulsing glow */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        style={{
          background: "var(--gradient-amber)",
          boxShadow: "var(--shadow-hover)",
        }}
        aria-label="Open support desk hub"
        type="button"
      >
        {/* Glow indicator pulse */}
        <span className="absolute inset-0 rounded-2xl bg-amber-400 opacity-30 animate-ping" />

        {/* Icon toggle */}
        {isOpen ? (
          <span className="text-2xl font-black text-white relative z-10 transition-transform duration-300 rotate-90">✕</span>
        ) : (
          <span className="text-2xl relative z-10 transition-transform duration-300 group-hover:rotate-12">📞</span>
        )}
      </button>
    </div>
  );
}
