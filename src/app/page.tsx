"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TerminalTypewriter } from "@/components/terminal-typewriter";
import {
  FileText,
  Download,
  Sparkles,
} from "lucide-react";

const TERMINAL_LINES = [
  { text: "blueprint --init", prefix: ">" },
  { text: "booting agent runtime...", prefix: "  ", delay: 500 },
  { text: "connecting to opencode go (deepseek-v4-pro)", prefix: "  ", delay: 300 },
  { text: "", prefix: "", delay: 400 },

  // Research thinking
  { text: "blueprint --new \"ai fitness coach\"", prefix: ">", delay: 600 },
  { text: "[thinking] ok, let me analyze this product idea...", prefix: "  ", delay: 400 },
  { text: "[thinking] fitness + AI = large market. post-pandemic health awareness is surging. wearable adoption at all-time high. this is a valid category.", prefix: "  ", delay: 200 },
  { text: "[research] searching for market data on AI fitness apps...", prefix: "  ", delay: 300 },
  { text: "[research] TAM estimated at $4.2B, growing at 28% CAGR (source: industry aggregate 2026)", prefix: "  ", delay: 400 },
  { text: "[research] top competitors identified: Freeletics (brand, no AI), Nike Training Club (ecosystem, no personalization), Future.co (1:1 coaching, expensive $149/mo)", prefix: "  ", delay: 400 },
  { text: "[research] key gap: no competitor combines real-time biometrics + AI-driven plan adaptation. our differentiator is hyper-personalization at $9.99/mo.", prefix: "  ", delay: 400 },
  { text: "[research] viability score: 78/100. strong market, weak moat, execution-heavy.", prefix: "  ", delay: 400 },

  // Stories thinking
  { text: "[thinking] now structuring user stories. need 3 personas...", prefix: "  ", delay: 500 },
  { text: "[stories] generating 14 stories across 3 epics (onboarding, core workout, progress tracking)", prefix: "  ", delay: 300 },
  { text: "[stories] US-001: AI workout engine that cycles plans based on 24h biometric delta. P0 · Must", prefix: "  ", delay: 300 },
  { text: "[stories] US-004: equipment-aware planner that adapts when user switches gym/home/travel. P0 · Must", prefix: "  ", delay: 300 },
  { text: "[stories] US-009: progress dashboard with streak tracking, body metrics, and adaptive goals. P1 · Should", prefix: "  ", delay: 300 },
  { text: "[stories] MoSCoW: 4 Must · 5 Should · 3 Could · 2 Won't. strong MVP scope.", prefix: "  ", delay: 300 },

  // Wireframes
  { text: "[wireframes] rendering 3 screens: dashboard, workout builder, progress view...", prefix: "  ", delay: 400 },
  { text: "[wireframes] done. clean mobile-first layouts. red CTA for primary actions.", prefix: "  ", delay: 300 },

  // PRD
  { text: "[prd] assembling document from research + stories + wireframes...", prefix: "  ", delay: 400 },
  { text: "[prd] goals defined: D7 retention >40%, workout completion rate >65%, NPS >50", prefix: "  ", delay: 300 },
  { text: "[prd] risks: AI hallucination (med), biometric privacy compliance (high), user trust (high)", prefix: "  ", delay: 300 },

  // Roadmap
  { text: "[roadmap] planning phases...", prefix: "  ", delay: 400 },
  { text: "[roadmap] phase 1 (wks 1-4): MVP — auth, AI engine, basic workout UI, biometric input", prefix: "  ", delay: 300 },
  { text: "[roadmap] phase 2 (wks 5-8): social features, progress analytics, wearable sync (Apple Health, Fitbit)", prefix: "  ", delay: 300 },
  { text: "[roadmap] phase 3 (wks 9-12): coach marketplace, API for gyms, enterprise tier", prefix: "  ", delay: 300 },

  { text: "", prefix: "", delay: 400 },
  { text: "pipeline complete. 5/5 agents ran successfully.", prefix: ">", delay: 500 },
  { text: "total time: 4.2 minutes. output: 14 stories · 3 wireframes · 1 PRD · 1 roadmap", prefix: "  ", delay: 400 },
  { text: "blueprint v1.0 — from idea to roadmap in one workflow.", prefix: ">", delay: 600 },
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
      "Five AI agents run in sequence, producing a complete product package with citations, wireframe mockups, and a phased sprint plan.",
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

  // Show headline after 2.5s — before terminal finishes
  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Show CTA when terminal completes or after ~8s
  function handleTerminalDone() {
    if (!showCTA) setTimeout(() => setShowCTA(true), 600);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero Section ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-8">

        {/* Terminal window */}
        <div className="relative z-10 w-full max-w-2xl">
          {/* Window chrome */}
          <div className="flex items-center justify-between gap-1.5 rounded-t-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 font-sans text-[10px] text-white/30 tracking-wider uppercase">
                blueprint.app
              </span>
            </div>
            <span className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 font-mono text-[9px] text-amber-400/70">SIMULATION</span>
          </div>

          {/* Terminal body */}
          <div className="rounded-b-xl border border-t-0 border-white/[0.08] bg-zinc-900/70 shadow-2xl shadow-black/60 ring-1 ring-white/[0.05] px-6 py-6 backdrop-blur-md min-h-[380px]">
            <TerminalTypewriter
              lines={TERMINAL_LINES}
              onComplete={() => {
                setHeroReady(true);
                handleTerminalDone();
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
            From Idea to Roadmap
          </h1>
          <h2 className="mt-2 font-sans text-[28px] font-bold tracking-tight text-red-500 sm:text-5xl">
            in One Workflow
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed tracking-wider text-white/60 sm:text-xl">
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

        <p className="mt-6 text-center text-sm font-normal text-white/80">
          Built by{" "}
          <span className="font-semibold">Md. Arafath Hossain Akash</span>
          {" "}·{" "}
          <a
            href="https://github.com/ArafathUIU"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 underline-offset-2 hover:text-white/80 transition-colors"
          >
            github.com/ArafathUIU
          </a>
        </p>
      </section>
    </div>
  );
}
