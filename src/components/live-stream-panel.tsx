"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface StreamEntry {
  type: "header" | "token" | "spinner" | "error" | "done";
  step?: string;
  text?: string;
  stepLabel?: string;
}

interface LiveStreamPanelProps {
  entries: StreamEntry[];
  className?: string;
}

const STEP_LABELS: Record<string, string> = {
  research: "Market Research",
  stories: "User Stories",
  wireframes: "Wireframes",
  prd: "PRD Document",
  roadmap: "Roadmap",
};

export function LiveStreamPanel({ entries, className }: LiveStreamPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      className={cn(
        "relative w-full max-w-2xl overflow-hidden rounded-xl border border-border/50",
        "bg-black/90 backdrop-blur-sm",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 border-b border-white/5 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 font-mono text-[10px] text-white/30">
          blueprint-agent
        </span>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex max-h-[500px] min-h-[200px] flex-col gap-0 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
      >
        {entries.map((entry, i) => {
          if (entry.type === "header" && entry.step) {
            return (
              <div key={i} className="mb-1 mt-3 first:mt-0">
                <span className="text-white/30">
                  {"// "}&#9472;&#9472;&#9472;{" "}
                </span>
                <span className="font-semibold text-red-400">
                  {STEP_LABELS[entry.step] || entry.step}
                </span>
                <span className="text-white/30">
                  {" "}&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;
                </span>
              </div>
            );
          }

          if (entry.type === "spinner" && entry.step) {
            return (
              <div
                key={i}
                className="mb-1 mt-3 flex animate-pulse items-center gap-2 first:mt-0"
              >
                <span className="text-white/30">
                  {"// "}&#9472;&#9472;&#9472;{" "}
                </span>
                <span className="font-semibold text-rose-400">
                  {STEP_LABELS[entry.step] || entry.step}
                </span>
                <span className="text-white/30">
                  {" "}&#9472;&#9472;&#9472;
                </span>
                <svg
                  className="h-3.5 w-3.5 animate-spin text-rose-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-white/20">generating...</span>
              </div>
            );
          }

          if (entry.type === "token" && entry.text) {
            return (
              <div key={i} className="group flex">
                <span className="mr-3 shrink-0 select-none text-white/10 group-hover:text-white/20">
                  {">"}
                </span>
                <span className="text-white/85">{entry.text}</span>
                {i === entries.length - 1 && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-red-500" />
                )}
              </div>
            );
          }

          if (entry.type === "done" && entry.step) {
            return (
              <div key={i} className="mb-2 mt-1">
                <span className="text-green-400/60">
                  {"// "}{STEP_LABELS[entry.step] || entry.step} &#10003; done
                </span>
              </div>
            );
          }

          if (entry.type === "error") {
            return (
              <div key={i} className="mb-1 mt-2">
                <span className="text-red-500">
                  {"// "}&#10007; {entry.text}
                </span>
              </div>
            );
          }

          return null;
        })}

        {entries.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <span className="animate-pulse text-white/15">
              Waiting for agent...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
