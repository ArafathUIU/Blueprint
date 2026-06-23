"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LiveStreamPanel, type StreamEntry } from "@/components/live-stream-panel";
import { cn } from "@/lib/utils";

const ORDER = ["research", "stories", "wireframes", "prd", "roadmap"];
const MAX_IDEA_LENGTH = 800;
const STEP_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  research: { label: "Research", icon: "\u{1F50D}", color: "text-red-400" },
  stories: { label: "Stories", icon: "\u{1F4CB}", color: "text-amber-400" },
  wireframes: { label: "Design", icon: "\u{1F3A8}", color: "text-rose-400" },
  prd: { label: "PRD", icon: "\u{1F4C4}", color: "text-green-400" },
  roadmap: { label: "Roadmap", icon: "\u{1F5FA}\uFE0F", color: "text-cyan-400" },
};

type StepState = "idle" | "running" | "done" | "error";

export default function NewProjectPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"name" | "desc" | "running">("name");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [lineBuffer, setLineBuffer] = useState<{ prefix: string; text: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [stepStates, setStepStates] = useState<Record<string, StepState>>({ research: "idle", stories: "idle", wireframes: "idle", prd: "idle", roadmap: "idle" });
  const [entries, setEntries] = useState<StreamEntry[]>([]);
  const [runError, setRunError] = useState<string | null>(null);
  const [currentStreamStep, setCurrentStreamStep] = useState<string | null>(null);
  const streamTextRef = useRef<Record<string, string>>({});

  // Auto-scroll terminal
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lineBuffer, entries]);

  // Focus input on phase change
  useEffect(() => {
    if (phase === "name") inputRef.current?.focus();
    if (phase === "desc") {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [phase]);

  function handleNameSubmit() {
    const name = projectName.trim();
    if (!name) return;
    setLineBuffer((p) => [...p, { prefix: ">", text: `new` }]);
    setLineBuffer((p) => [...p, { prefix: "", text: `Project name: ${name}` }]);
    setPhase("desc");
  }

  function handleDescSubmit() {
    const desc = description.trim();
    if (!desc || desc.length < 10) return;
    setLineBuffer((p) => [...p, { prefix: "", text: `Description: ${desc}` }]);
    setLineBuffer((p) => [...p, { prefix: "", text: "" }]);
    setLineBuffer((p) => [...p, { prefix: ">", text: `blueprint --generate "${projectName.trim()}"` }]);
    setLineBuffer((p) => [...p, { prefix: "", text: "booting agent runtime..." }]);
    setPhase("running");
    runPipeline(projectName.trim(), desc);
  }

  const updateStep = useCallback((step: string, state: StepState) => {
    setStepStates((prev) => ({ ...prev, [step]: state }));
  }, []);

  async function runPipeline(name: string, idea: string) {
    setRunError(null);
    setEntries([]);
    setStepStates({ research: "idle", stories: "idle", wireframes: "idle", prd: "idle", roadmap: "idle" });

    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, name }),
      });
      if (!createRes.ok) throw new Error((await createRes.json()).error || "Failed to create project");
      const project = await createRes.json();

      const sseRes = await fetch(`/api/projects/${project.id}/pipeline/stream`, { method: "POST" });
      if (!sseRes.ok) throw new Error(`Pipeline failed (${sseRes.status})`);

      const reader = sseRes.body?.getReader();
      if (!reader) throw new Error("No SSE response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            switch (event.type) {
              case "step_start": { updateStep(event.step, "running"); setCurrentStreamStep(event.step); setEntries((p) => [...p, { type: "header", step: event.step }]); break; }
              case "step_start_spinner": { updateStep(event.step, "running"); setCurrentStreamStep(event.step); setEntries((p) => [...p, { type: "spinner", step: event.step }]); break; }
              case "token": {
                const step = event.step; streamTextRef.current[step] = (streamTextRef.current[step] || "") + event.text;
                setEntries((p) => { const f = p.filter((e) => !(e.type === "token" && e.step === step)); return [...f, { type: "token", step, text: streamTextRef.current[step] }]; });
                break;
              }
              case "step_end": { updateStep(event.step, "done"); setEntries((p) => [...p, { type: "done", step: event.step }]); break; }
              case "step_end_spinner": { updateStep(event.step, "done"); setEntries((p) => [...p.filter((e) => !(e.type === "spinner" && e.step === event.step)), { type: "done", step: event.step }]); break; }
              case "error": { updateStep(event.step, "error"); setEntries((p) => [...p, { type: "error", step: event.step, text: event.message }]); setRunError(event.message); break; }
              case "done": { setCurrentStreamStep(null); setTimeout(() => router.push(`/projects/${event.projectId}`), 1500); break; }
            }
          } catch { /* skip unparseable */ }
        }
      }
    } catch (e: unknown) { setRunError(e instanceof Error ? e.message : "Something went wrong"); }
  }

  const completedCount = Object.values(stepStates).filter((s) => s === "done").length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center px-4 pt-10 pb-8">
      {/* Terminal Window */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Window Chrome */}
        <div className="flex items-center justify-between rounded-t-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-2 font-sans text-[10px] text-white/30 tracking-wider uppercase">
              {projectName.trim() ? projectName.trim() : "blueprint"} — bash — 80×24
            </span>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={scrollRef}
          className="rounded-b-xl border border-t-0 border-white/[0.08] bg-zinc-950/80 shadow-2xl shadow-black/60 ring-1 ring-white/[0.05] px-6 py-5 backdrop-blur-md min-h-[600px] overflow-y-auto font-mono text-[12px] leading-relaxed"
        >
          {/* ── PHASE 1: Project Name ── */}
          {phase === "name" && (
            <>
              {lineBuffer.map((l, i) => (
                <div key={i} className="flex">
                  {l.prefix && <span className="mr-2 shrink-0 text-red-500/70">{l.prefix}</span>}
                  <span className="text-white/80">{l.text}</span>
                </div>
              ))}
              {lineBuffer.length === 0 && (
                <div className="flex items-center gap-0 text-white/40 text-[11px] mb-2">
                  <span className="mr-2 text-red-500/70">{">"}</span>
                  <span>blueprint --new</span>
                </div>
              )}
              <div className="flex items-center gap-0 mt-1">
                {lineBuffer.length === 0 && <span className="mr-2 text-red-500/70">{">"}</span>}
                <label className="shrink-0 text-green-400/80">project-name@blueprint:~$ </label>
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleNameSubmit(); }}
                    className="w-full bg-transparent text-white/90 outline-none caret-red-500"
                    placeholder="my-project"
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
                <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-red-500/70" />
              </div>
            </>
          )}

          {/* ── PHASE 2: Description ── */}
          {phase === "desc" && (
            <>
              {lineBuffer.map((l, i) => (
                <div key={i} className="flex">
                  {l.prefix && <span className="mr-2 shrink-0 text-red-500/70">{l.prefix}</span>}
                  <span className="text-white/80">{l.text}</span>
                </div>
              ))}
              <div className="flex items-start gap-0 mt-1">
                <label className="shrink-0 text-green-400/80">project-name@blueprint:~$ </label>
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleDescSubmit();
                      }
                    }}
                    className="w-full bg-transparent text-white/90 outline-none caret-red-500 resize-none"
                    rows={3}
                    placeholder="Describe your product idea..."
                    autoFocus
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
                <span className="ml-0.5 mt-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-red-500/70" />
              </div>
              <div className="mt-2 text-[10px] text-white/20 flex justify-between">
                <span>Enter to submit · Shift+Enter for new line · Min 10 characters</span>
                <span className={description.length > MAX_IDEA_LENGTH ? "text-red-400" : "text-white/20"}>{description.length}/{MAX_IDEA_LENGTH}</span>
              </div>
            </>
          )}

          {/* ── PHASE 3: Pipeline Running ── */}
          {phase === "running" && (
            <>
              {lineBuffer.map((l, i) => (
                <div key={i} className="flex">
                  {l.prefix && <span className="mr-2 shrink-0 text-red-500/70">{l.prefix}</span>}
                  <span className="text-white/80">{l.text}</span>
                </div>
              ))}

              <div className="mt-4 mb-3">
                <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3">
                  {ORDER.map((step) => {
                    const config = STEP_CONFIG[step]; const state = stepStates[step]; const isCurrent = currentStreamStep === step;
                    return (
                      <div key={step} className={cn("flex items-center gap-1.5 transition-all", isCurrent && "scale-105")}>
                        <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] transition-all", state === "idle" && "bg-white/5 text-white/20", state === "running" && "bg-white/5 text-white ring-1 ring-white/20 animate-pulse", state === "done" && "bg-red-600/20 text-red-300 ring-1 ring-red-500/40", state === "error" && "bg-red-900/30 text-red-400 ring-1 ring-red-500/50")}>
                          {state === "done" ? "\u2713" : state === "error" ? "\u2717" : config.icon}
                        </div>
                        <span className={cn("text-[10px] font-medium whitespace-nowrap", state === "idle" && "text-white/15", state === "running" && "text-white/60", state === "done" && "text-white/80", state === "error" && "text-red-400")}>{config.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <LiveStreamPanel entries={entries} className="w-full border-white/[0.06] shadow-lg shadow-black/40" />

              {runError && (
                <div className="mt-4 font-sans text-[11px] text-red-400 bg-red-950/20 border border-red-500/20 rounded px-3 py-2">
                  {"> "}error: {runError}
                </div>
              )}

              {completedCount === ORDER.length && (
                <div className="mt-4 flex items-center gap-2 text-[11px] text-green-400/80">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                  pipeline complete. opening blueprint...
                  <span className="inline-block h-3.5 w-1.5 animate-pulse bg-green-400/70" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
