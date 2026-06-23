"use client";

import { useState } from "react";

const ACCENT_BORDER: Record<string, string> = {
  red: "border-l-red-500/50", amber: "border-l-amber-500/50",
  green: "border-l-green-500/50", cyan: "border-l-cyan-500/50",
};
const ACCENT_BG: Record<string, string> = {
  red: "bg-red-500/5", amber: "bg-amber-500/5",
  green: "bg-green-500/5", cyan: "bg-cyan-500/5",
};

export function ThinkingBlock({ label, text, accent }: { label: string; text: string; accent: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`mb-5 rounded-xl border border-zinc-800 ${ACCENT_BG[accent] || "bg-white/[0.02]"} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors">
        <svg className={`h-3.5 w-3.5 shrink-0 text-${accent}-400 transition-transform ${open ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <span className={`text-[11px] font-semibold uppercase tracking-wider text-${accent}-400`}>{label}</span>
        <span className="text-[10px] text-zinc-600 ml-auto">{open ? "collapse" : "expand"}</span>
      </button>
      {open && (
        <div className={`px-4 py-3 border-t border-zinc-800 ${ACCENT_BORDER[accent] || ""} border-l-2 font-mono text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto`}>
          {text}
        </div>
      )}
    </div>
  );
}
