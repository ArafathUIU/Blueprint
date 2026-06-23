"use client";

import { useState, useRef } from "react";

interface WireframeChatProps {
  projectId: string;
  wireframeId: string;
  currentSvg: string;
  onSvgUpdate: (newSvg: string) => void;
}

interface ChatEntry {
  role: "user" | "agent";
  text: string;
}

export function WireframeChat({ projectId, wireframeId, currentSvg, onSvgUpdate }: WireframeChatProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSend() {
    const cmd = input.trim();
    if (!cmd || loading) return;

    setInput("");
    setError(null);
    setHistory((prev) => [...prev, { role: "user", text: cmd }]);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/wireframes/${wireframeId}/edit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: cmd }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Edit failed");
      }

      const data = await res.json();
      onSvgUpdate(data.svg);
      setHistory((prev) => [...prev, { role: "agent", text: "updated" }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Edit failed";
      setError(msg);
      setHistory((prev) => [...prev, { role: "agent", text: `failed: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Chat history */}
      {history.length > 0 && (
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {history.map((entry, i) => (
            <div key={i} className="flex gap-1.5 text-[10px]">
              <span className={`shrink-0 font-semibold ${entry.role === "user" ? "text-rose-400" : entry.text === "updated" ? "text-green-400" : "text-red-400"}`}>
                {entry.role === "user" ? ">" : entry.text === "updated" ? "✓" : "✗"}
              </span>
              <span className={entry.role === "user" ? "text-zinc-300" : "text-zinc-500"}>
                {entry.role === "user" ? entry.text : entry.text === "updated" ? "" : entry.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder='e.g. "make the CTA bigger"'
          disabled={loading}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[11px] text-white placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-rose-500 disabled:opacity-40 transition-colors"
        >
          {loading ? "..." : "Edit"}
        </button>
      </div>

      {error && (
        <p className="text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}
