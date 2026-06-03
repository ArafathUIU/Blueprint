"use client";

import { useState } from "react";
import Link from "next/link";
import { TerminalTypewriter } from "@/components/terminal-typewriter";
import { AudioWaveform } from "@/components/audio-waveform";
import {
  FileText,
  Download,
  Sparkles,
} from "lucide-react";

const TERMINAL_LINES = [
  { text: "blueprint --init", prefix: ">" },
  { text: "connecting to agent core...", prefix: "  ", delay: 600 },
  { text: "loading market research engine", prefix: "  ", delay: 300 },
  { text: "loading story generator", prefix: "  ", delay: 200 },
  { text: "loading wireframe designer", prefix: "  ", delay: 200 },
  { text: "loading PRD assembler", prefix: "  ", delay: 200 },
  { text: "loading roadmap planner", prefix: "  ", delay: 200 },
  { text: "all systems ready.", prefix: "  ", delay: 500 },
  { text: "", prefix: "", delay: 600 },
  { text: 'blueprint --new "ai fitness app"', prefix: ">", delay: 700 },
  { text: "→ researching market (TAM: $4.2B, 5 competitors)", prefix: "  ", delay: 400 },
  { text: "→ generating 12 user stories across 3 epics", prefix: "  ", delay: 350 },
  { text: "→ rendering 3 wireframe screens", prefix: "  ", delay: 350 },
  { text: "→ assembling PRD with goals & risk matrix", prefix: "  ", delay: 350 },
  { text: "→ building 4-phase development roadmap", prefix: "  ", delay: 350 },
  { text: "done. 5/5 agents complete. opening project view...", prefix: "  ", delay: 600 },
  { text: "", prefix: "", delay: 400 },
  { text: "blueprint v1.0 — 10x faster than manual. ready.", prefix: ">", delay: 500 },
];

const HOW_IT_WORKS = [
  {
    icon: Sparkles,
    title: "Enter your idea",
    description:
      "Type a product concept — a fitness app, SaaS dashboard, marketplace — anything. The agent parses your intent and kicks off the pipeline.",
  },
  {
    icon: FileText,
    title: "Agent generates everything",
    description:
      "Five specialized AI agents run sequentially: market research, user stories with acceptance criteria, SVG wireframes, a complete PRD, and a phased roadmap.",
  },
  {
    icon: Download,
    title: "Export & execute",
    description:
      "Download your blueprint as Markdown, print it as PDF, or copy it into your docs. Engineering-ready output in minutes, not weeks.",
  },
];

export default function Home() {
  const [heroReady, setHeroReady] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero Section ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-8">
        {/* Waveform at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 h-20 z-0 opacity-40">
          {showWaveform && <AudioWaveform state="streaming" />}
        </div>

        {/* Terminal window */}
        <div className="relative z-10 w-full max-w-2xl">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 rounded-t-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            <span className="ml-2 font-sans text-[10px] text-white/30 tracking-wider uppercase">
              blueprint.app
            </span>
          </div>

          {/* Terminal body */}
          <div className="rounded-b-xl border border-t-0 border-white/[0.08] bg-zinc-900/70 shadow-2xl shadow-black/60 ring-1 ring-white/[0.05] px-6 py-6 backdrop-blur-md min-h-[380px]">
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
          <h1 className="font-sans text-[28px] font-bold tracking-tight text-white sm:text-5xl">
            from idea to roadmap
          </h1>
          <h2 className="mt-2 font-sans text-[28px] font-bold tracking-tight text-red-500 sm:text-5xl">
            in one workflow
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-white/60 sm:text-xl">
            Research. Stories. Wireframes. PRD. Roadmap.
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm font-normal leading-relaxed text-white/25">
            An autonomous AI agent that collapses 6 tools into 1.
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
      </section>

      {/* ── How It Works ── */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center font-sans text-2xl font-semibold tracking-tight text-white/80 sm:text-3xl">
          How it works
        </h2>

        <div className="grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                  <Icon className="h-5 w-5 text-red-400" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-xs text-red-500/50">
                    0{i + 1}
                  </span>
                  <h3 className="font-sans text-base font-semibold text-white/85">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm font-normal leading-relaxed text-white/35">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Output Preview Card ── */}
      <section className="relative z-10 mx-auto w-full max-w-2xl px-6 pb-20">
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 shadow-2xl shadow-black/60 ring-1 ring-white/[0.05] p-1 backdrop-blur-md">
          <div className="flex items-center gap-1.5 rounded-t-xl px-4 py-2.5">
            <div className="h-2 w-2 rounded-full bg-red-500/60" />
            <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
            <div className="h-2 w-2 rounded-full bg-green-500/60" />
            <span className="ml-2 font-mono text-[10px] text-white/30">
              output/sample-blueprint.md
            </span>
          </div>
          <div className="flex flex-col gap-0 rounded-xl bg-zinc-900/80 px-5 py-4 font-mono text-xs leading-relaxed">
            <span className="text-white/25">
              {"# "}Market Research — 78/100 viability
            </span>
            <span className="text-white/15">
              {"## "}TAM $4.2B growing at 28% CAGR
            </span>
            <span className="text-white/15">
              {"## "}5 competitors mapped: gaps in AI personalization
            </span>
            <span className="text-white/15">
              {"## "}3 personas: fitness beginner, gym regular, PT
            </span>
            <span className="mt-3 text-white/25">
              {"# "}User Stories — 14 generated, MoSCoW ranked
            </span>
            <span className="text-white/15">
              {"## "}US-001 AI workout engine • cycles biometrics every 24h
            </span>
            <span className="text-white/15">
              {"## "}US-004 equipment-aware planner • adapts in real time
            </span>
            <span className="text-white/15">
              {"## "}US-009 progress dashboard • streak tracking, body metrics
            </span>
            <span className="mt-3 text-white/25">
              {"# "}Roadmap — shipping in 3 phases
            </span>
            <span className="text-white/15">
              {"## "}Phase 1 — Core (Weeks 1-4): AI planner, auth, workout UI
            </span>
            <span className="text-white/15">
              {"## "}Phase 2 — Growth (Weeks 5-8): social, analytics, wearables
            </span>
            <span className="text-white/15">
              {"## "}Phase 3 — Scale (Weeks 9-12): marketplace, coach tools, API
            </span>
            <span className="mt-3 inline-block h-3 w-2 animate-pulse bg-red-500/50" />
          </div>
        </div>

        <p className="mt-6 text-center text-sm font-normal text-white/15">
          Built with OpenCode Go · DeepSeek V4 Pro · Next.js 16
        </p>
      </section>
    </div>
  );
}
