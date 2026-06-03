"use client";

import { useState } from "react";
import Link from "next/link";
import { TerminalTypewriter } from "@/components/terminal-typewriter";
import { AudioWaveform } from "@/components/audio-waveform";

const TERMINAL_LINES = [
  { text: "blueprint --init", prefix: ">" },
  { text: "connecting to agent core...", prefix: "  ", delay: 600 },
  { text: "loading market research engine", prefix: "  ", delay: 300 },
  { text: "loading story generator", prefix: "  ", delay: 200 },
  { text: "loading wireframe designer", prefix: "  ", delay: 200 },
  { text: "loading PRD assembler", prefix: "  ", delay: 200 },
  { text: "loading roadmap planner", prefix: "  ", delay: 200 },
  { text: "all systems ready.", prefix: "  ", delay: 500 },
  { text: 'blueprint --new "your product idea goes here"', prefix: ">", delay: 800 },
  { text: "→ 1. market research", prefix: "  ", delay: 400 },
  { text: "→ 2. user stories & acceptance criteria", prefix: "  ", delay: 300 },
  { text: "→ 3. wireframe mockups (SVG)", prefix: "  ", delay: 300 },
  { text: "→ 4. complete PRD document", prefix: "  ", delay: 300 },
  { text: "→ 5. phased development roadmap", prefix: "  ", delay: 300 },
  { text: "10x faster than manual. 100% AI-powered.", prefix: "  ", delay: 500 },
];

export default function Home() {
  const [heroReady, setHeroReady] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
      {/* Waveform at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 z-0 opacity-40">
        {showWaveform && <AudioWaveform state="streaming" />}
      </div>

      {/* Terminal window */}
      <div className="relative z-10 w-full max-w-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 rounded-t-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 font-sans text-[10px] text-white/20 tracking-wider uppercase">
            blueprint.app
          </span>
        </div>

        {/* Terminal body */}
        <div className="rounded-b-xl border border-t-0 border-white/[0.06] bg-black/60 px-5 py-5 backdrop-blur-md">
          <TerminalTypewriter
            lines={TERMINAL_LINES}
            onComplete={() => {
              setHeroReady(true);
              setTimeout(() => {
                setShowWaveform(true);
                setTimeout(() => setShowCTA(true), 600);
              }, 400);
            }}
          />
        </div>
      </div>

      {/* Headline — appears after terminal */}
      <div
        className={`mt-10 text-center transition-all duration-700 ${
          heroReady
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <h1 className="font-sans text-3xl font-bold tracking-tight text-white sm:text-5xl">
          from idea to roadmap
        </h1>
        <h2 className="mt-2 font-sans text-3xl font-bold tracking-tight text-red-500 sm:text-5xl">
          in one workflow
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/30 sm:text-base">
          Research. Stories. Wireframes. PRD. Roadmap.
          <br />An autonomous AI agent that collapses 6 tools into 1.
        </p>
      </div>

      {/* CTA — appears after headline */}
      <div
        className={`mt-8 transition-all duration-700 delay-300 ${
          showCTA
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <Link
          href="/new"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20"
        >
          Start a new blueprint
        </Link>
      </div>
    </div>
  );
}
