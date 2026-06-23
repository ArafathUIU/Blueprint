"use client";

import { cn } from "@/lib/utils";
import type { RoadmapPhase } from "@/lib/types";

function parseTimeline(timeline: string): { start: number; end: number } {
  const nums = timeline.match(/(\d+)/g);
  if (!nums || nums.length < 2) return { start: 0, end: 4 };
  return { start: parseInt(nums[0]), end: parseInt(nums[1]) };
}

const PHASE_COLORS = [
  { bar: "bg-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-300" },
  { bar: "bg-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-300" },
  { bar: "bg-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300" },
  { bar: "bg-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-300" },
  { bar: "bg-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-300" },
];

interface GanttChartProps {
  phases: RoadmapPhase[];
}

export function GanttChart({ phases }: GanttChartProps) {
  if (!phases.length) return null;

  const parsed = phases.map((p) => ({ ...p, ...parseTimeline(p.timeline) }));
  const totalStart = Math.min(...parsed.map((p) => p.start));
  const totalEnd = Math.max(...parsed.map((p) => p.end));
  const totalSpan = totalEnd - totalStart || 1;

  const weekMarkers: number[] = [];
  for (let w = totalStart; w <= totalEnd; w++) {
    if (w % 4 === 0 || w === totalStart || w === totalEnd) weekMarkers.push(w);
  }
  if (!weekMarkers.includes(totalEnd)) weekMarkers.push(totalEnd);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Gantt Timeline</span>
        </div>
        <span className="text-[10px] text-zinc-600">{phases.length} phases · {totalSpan} weeks</span>
      </div>

      {/* Timeline header */}
      <div className="flex border-b border-zinc-800/50">
        <div className="w-44 shrink-0 px-4 py-2 border-r border-zinc-800/50">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">Phase</span>
        </div>
        <div className="flex-1 relative px-1 py-2">
          <div className="flex justify-between">
            {weekMarkers.map((w) => (
              <span key={w} className="text-[9px] text-zinc-600 tabular-nums">
                W{w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Phase rows */}
      <div className="divide-y divide-zinc-800/50">
        {parsed.map((phase, i) => {
          const colors = PHASE_COLORS[i % PHASE_COLORS.length];
          const leftPct = ((phase.start - totalStart) / totalSpan) * 100;
          const widthPct = ((phase.end - phase.start) / totalSpan) * 100;

          return (
            <div key={i} className="flex group">
              {/* Phase label */}
              <div className="w-44 shrink-0 px-4 py-3 border-r border-zinc-800/50 flex flex-col justify-center">
                <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {phase.phase}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  {phase.timeline} · {phase.deliverables.length} deliverables
                </span>
              </div>

              {/* Bar area */}
              <div className="flex-1 relative px-1 py-2">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {weekMarkers.map((w) => (
                    <div
                      key={w}
                      className="flex-1 border-l border-zinc-800/30 first:border-l-0"
                      style={{ marginLeft: w === totalStart ? 0 : undefined }}
                    />
                  ))}
                </div>

                {/* Phase bar */}
                <div
                  className={cn(
                    "relative h-8 rounded-md border transition-all duration-200 group-hover:brightness-125 group-hover:-translate-y-0.5 group-hover:shadow-lg",
                    colors.bar,
                    colors.border
                  )}
                  style={{
                    marginLeft: `${leftPct}%`,
                    width: `${Math.max(widthPct, 4)}%`,
                  }}
                  title={phase.deliverables.join(" · ")}
                >
                  {/* Subtle shimmer */}
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Story count badge */}
                  {phase.stories.length > 0 && (
                    <span className="absolute inset-y-0 right-1.5 flex items-center">
                      <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[9px] font-semibold text-white/80 tabular-nums">
                        {phase.stories.length}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-zinc-800/50">
        {parsed.map((phase, i) => {
          const colors = PHASE_COLORS[i % PHASE_COLORS.length];
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-sm", colors.bar)} />
              <span className="text-[9px] text-zinc-500 truncate max-w-[100px]">{phase.phase}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
