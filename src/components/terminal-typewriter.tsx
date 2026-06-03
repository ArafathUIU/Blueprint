"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterProps {
  lines: { text: string; delay?: number; prefix?: string }[];
  onComplete?: () => void;
}

export function TerminalTypewriter({ lines, onComplete }: TypewriterProps) {
  const [visibleLines, setVisibleLines] = useState<{ text: string; prefix: string }[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines]);

  useEffect(() => {
    if (done) return;

    if (currentLineIdx >= lines.length) {
      setDone(true);
      onComplete?.();
      return;
    }

    const line = lines[currentLineIdx];
    const speed = currentLineIdx === 0 ? 80 : 10 + Math.random() * 15;

    if (charIdx === 0) {
      timerRef.current = setTimeout(() => {
        setCharIdx(1);
      }, line.delay ?? 200);
      return;
    }

    if (charIdx <= line.text.length) {
      timerRef.current = setTimeout(() => {
        const partial = line.text.slice(0, charIdx);
        setVisibleLines((prev) => {
          const copy = [...prev];
          const existing = copy.find((l) => l.prefix === (line.prefix || "$"));
          if (existing) {
            existing.text = partial;
          } else {
            copy.push({ text: partial, prefix: line.prefix || "$" });
          }
          return copy;
        });
        setCharIdx((c) => c + 1);
      }, speed);
    } else {
      timerRef.current = setTimeout(() => {
        setCurrentLineIdx((i) => i + 1);
        setCharIdx(0);
      }, 300);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentLineIdx, charIdx, lines, done, onComplete]);

  return (
    <div ref={scrollRef} className="max-h-[380px] overflow-y-auto font-mono text-[11px] leading-relaxed">
      {visibleLines.map((line, i) => (
        <div key={i} className="flex group">
          <span className="mr-2 shrink-0 text-red-500/70">{line.prefix}</span>
          <span className="text-white/80">{line.text}</span>
          {i === visibleLines.length - 1 && !done && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-red-500/70" />
          )}
        </div>
      ))}
      {visibleLines.length === 0 && (
        <div className="flex">
          <span className="mr-2 shrink-0 text-red-500/70">$</span>
          <span className="inline-block h-3.5 w-1.5 animate-pulse bg-red-500/70" />
        </div>
      )}
    </div>
  );
}
