"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveStreamPanel, type StreamEntry } from "@/components/live-stream-panel";
import { cn } from "@/lib/utils";

const ORDER = ["research", "stories", "wireframes", "prd", "roadmap"];
const MAX_IDEA_LENGTH = 800;
const STEP_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  research: { label: "Research", icon: "\u{1F50D}", color: "text-red-400" },
  stories: { label: "Stories", icon: "\u{1F4CB}", color: "text-amber-400" },
  wireframes: { label: "Design", icon: "\u{1F3A8}", color: "text-purple-400" },
  prd: { label: "PRD", icon: "\u{1F4C4}", color: "text-green-400" },
  roadmap: { label: "Roadmap", icon: "\u{1F5FA}\uFE0F", color: "text-cyan-400" },
};

type StepState = "idle" | "running" | "done" | "error";

export default function NewProjectPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({ research: "idle", stories: "idle", wireframes: "idle", prd: "idle", roadmap: "idle" });
  const [entries, setEntries] = useState<StreamEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamStep, setCurrentStreamStep] = useState<string | null>(null);
  const streamTextRef = useRef<Record<string, string>>({});

  const updateStep = useCallback((step: string, state: StepState) => {
    setStepStates((prev) => ({ ...prev, [step]: state }));
  }, []);

  // Navigation guard — warn before leaving mid-generation
  useEffect(() => {
    if (!loading) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);

  async function handleGenerate() {
    if (!idea.trim()) return;
    if (idea.trim().length < 10) { setError("Please write at least 10 characters describing your idea."); return; }
    if (idea.trim().length > MAX_IDEA_LENGTH) { setError(`Idea is too long. Please keep it under ${MAX_IDEA_LENGTH} characters.`); return; }
    setLoading(true);
    setError(null);
    setEntries([]);
    setStepStates({ research: "idle", stories: "idle", wireframes: "idle", prd: "idle", roadmap: "idle" });

    try {
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), name: name.trim() || idea.trim().slice(0, 50) }),
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
              case "error": { updateStep(event.step, "error"); setEntries((p) => [...p, { type: "error", step: event.step, text: event.message }]); setError(event.message); break; }
              case "done": { setCurrentStreamStep(null); setTimeout(() => router.push(`/projects/${event.projectId}`), 1500); break; }
            }
          } catch { /* skip unparseable */ }
        }
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setLoading(false); }
  }

  const completedCount = Object.values(stepStates).filter((s) => s === "done").length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        {!loading && (
          <>
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">What product are you building?</h1>
              <p className="text-white/40">Describe your idea. Blueprint will generate research, stories, wireframes, a PRD, and a roadmap.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-white/50">Project Name <span className="text-white/20">(optional)</span></Label>
                <Input id="name" placeholder="e.g. Fitness AI App" value={name} onChange={(e) => setName(e.target.value)} className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/20" />
                <p className="text-[10px] text-white/15">Used as the title for your blueprint. If left blank, the first few words of your idea become the project name.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="idea" className="text-white/50">Product Idea <span className="text-red-400">*</span></Label>
                <Textarea id="idea" placeholder="Describe your product in 1-3 sentences. What does it do? Who is it for? What problem does it solve?&#10;&#10;Example: A mobile app that uses AI to generate personalized workout plans based on user biometrics and available equipment. Targets fitness beginners who don't know where to start." value={idea} onChange={(e) => setIdea(e.target.value)} className="min-h-36 resize-y border-white/10 bg-white/[0.04] text-white placeholder:text-white/20" />
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/20">Minimum 10 characters</span>
                  <span className={idea.length > MAX_IDEA_LENGTH ? "text-red-400" : "text-white/20"}>{idea.length}/{MAX_IDEA_LENGTH}</span>
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={!idea.trim()}>Generate Product Blueprint</Button>
            </div>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-8 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              {ORDER.map((step, i) => {
                const config = STEP_CONFIG[step]; const state = stepStates[step]; const isCurrent = currentStreamStep === step;
                return (
                  <div key={step} className={cn("flex flex-col items-center gap-1 transition-all", isCurrent && "scale-110")}>
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all", state === "idle" && "bg-white/5 text-white/20", state === "running" && "bg-white/5 text-white ring-1 ring-white/20 animate-pulse", state === "done" && "bg-red-600/30 text-red-300 ring-1 ring-red-500/50", state === "error" && "bg-red-900/30 text-red-400 ring-1 ring-red-500/50")}>
                      {state === "done" ? "\u2713" : state === "error" ? "\u2717" : config.icon}
                    </div>
                    <span className={cn("text-[10px] font-medium whitespace-nowrap hidden sm:block", state === "idle" && "text-white/15", state === "running" && "text-white/60", state === "done" && "text-white/80", state === "error" && "text-red-400")}>{config.label}</span>
                  </div>
                );
              })}
            </div>
            <LiveStreamPanel entries={entries} className="w-full border-white/[0.08] shadow-2xl shadow-black/60" />
            <p className="text-[10px] text-white/15">Estimated time: 4–7 minutes. The agent is analyzing, generating stories, designing wireframes, and assembling your PRD and roadmap.</p>
            {error && <div className="w-full rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
            {completedCount === ORDER.length && <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/60"><span className="inline-block h-2 w-2 rounded-full bg-green-400" />Opening your blueprint...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
