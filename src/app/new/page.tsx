"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveStreamPanel, type StreamEntry } from "@/components/live-stream-panel";
import { cn } from "@/lib/utils";
import { createProject, saveProject } from "@/lib/store";
import type { Project } from "@/lib/types";

const ORDER = ["research", "stories", "wireframes", "prd", "roadmap"];

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
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({
    research: "idle", stories: "idle", wireframes: "idle", prd: "idle", roadmap: "idle",
  });
  const [entries, setEntries] = useState<StreamEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  async function handleGenerate() {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    setEntries([]);
    setStepStates({ research: "idle", stories: "idle", wireframes: "idle", prd: "idle", roadmap: "idle" });

    // Create project in localStorage
    const project = createProject(idea.trim(), name.trim() || idea.trim().slice(0, 50));
    saveProject(project);

    // Accumulate results
    const results: Partial<Project> = {};

    try {
      // ── Research ──
      setCurrentStep("research");
      setStepStates((p) => ({ ...p, research: "running" }));
      setEntries([{ type: "header", step: "research" }]);
      try {
        const res = await fetch(`/api/projects/${project.id}/research`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: project.idea }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `Research failed (${res.status})`);
        const data = await res.json();
        results.research = data.research;
        saveProject({ ...project, ...results });
        setStepStates((p) => ({ ...p, research: "done" }));
        setEntries((prev) => [...prev, { type: "done", step: "research" }]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Research failed";
        setStepStates((p) => ({ ...p, research: "error" }));
        setEntries((prev) => [...prev, { type: "error", step: "research", text: msg }]);
        throw new Error(msg);
      }

      // ── Stories ──
      setCurrentStep("stories");
      setStepStates((p) => ({ ...p, stories: "running" }));
      setEntries((prev) => [...prev, { type: "header", step: "stories" }]);
      try {
        const res = await fetch(`/api/projects/${project.id}/stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: project.idea, researchSummary: results.research?.summary || "" }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `Stories failed (${res.status})`);
        const data = await res.json();
        results.stories = data.stories;
        saveProject({ ...project, ...results });
        setStepStates((p) => ({ ...p, stories: "done" }));
        setEntries((prev) => [...prev, { type: "done", step: "stories" }]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Stories failed";
        setStepStates((p) => ({ ...p, stories: "error" }));
        setEntries((prev) => [...prev, { type: "error", step: "stories", text: msg }]);
        throw new Error(msg);
      }

      // ── Wireframes ──
      setCurrentStep("wireframes");
      setStepStates((p) => ({ ...p, wireframes: "running" }));
      setEntries((prev) => [...prev, { type: "spinner", step: "wireframes" }]);
      try {
        const res = await fetch(`/api/projects/${project.id}/wireframes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stories: results.stories }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `Wireframes failed (${res.status})`);
        const data = await res.json();
        results.wireframes = data.wireframes;
        saveProject({ ...project, ...results });
        setStepStates((p) => ({ ...p, wireframes: "done" }));
        setEntries((prev) => prev.filter((e) => e.type !== "spinner").concat({ type: "done", step: "wireframes" }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Wireframes failed";
        setStepStates((p) => ({ ...p, wireframes: "error" }));
        setEntries((prev) => prev.filter((e) => e.type !== "spinner").concat({ type: "error", step: "wireframes", text: msg }));
        throw new Error(msg);
      }

      // ── PRD ──
      setCurrentStep("prd");
      setStepStates((p) => ({ ...p, prd: "running" }));
      setEntries((prev) => [...prev, { type: "header", step: "prd" }]);
      try {
        const res = await fetch(`/api/projects/${project.id}/prd`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: project.idea, research: results.research, stories: results.stories, wireframes: results.wireframes }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `PRD failed (${res.status})`);
        const data = await res.json();
        results.prd = data.prd;
        saveProject({ ...project, ...results });
        setStepStates((p) => ({ ...p, prd: "done" }));
        setEntries((prev) => [...prev, { type: "done", step: "prd" }]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "PRD failed";
        setStepStates((p) => ({ ...p, prd: "error" }));
        setEntries((prev) => [...prev, { type: "error", step: "prd", text: msg }]);
        throw new Error(msg);
      }

      // ── Roadmap ──
      setCurrentStep("roadmap");
      setStepStates((p) => ({ ...p, roadmap: "running" }));
      setEntries((prev) => [...prev, { type: "header", step: "roadmap" }]);
      try {
        const res = await fetch(`/api/projects/${project.id}/roadmap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stories: results.stories }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `Roadmap failed (${res.status})`);
        const data = await res.json();
        results.roadmap = data.roadmap;
        const final: Project = { ...project, ...results, status: "complete" };
        saveProject(final);
        setStepStates((p) => ({ ...p, roadmap: "done" }));
        setEntries((prev) => [...prev, { type: "done", step: "roadmap" }]);
        setCurrentStep(null);

        setTimeout(() => router.push(`/projects/${project.id}`), 1000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Roadmap failed";
        setStepStates((p) => ({ ...p, roadmap: "error" }));
        setEntries((prev) => [...prev, { type: "error", step: "roadmap", text: msg }]);
        setError(msg);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Pipeline failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const completedCount = Object.values(stepStates).filter((s) => s === "done").length;
  const allDone = completedCount === ORDER.length;

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
                <Label htmlFor="name" className="text-white/50">Project Name (optional)</Label>
                <Input id="name" placeholder="e.g. Fitness AI App" value={name} onChange={(e) => setName(e.target.value)} className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/20" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="idea" className="text-white/50">Product Idea</Label>
                <Textarea id="idea" placeholder="A mobile app that uses AI to generate personalized workout plans based on user biometrics and available equipment..." value={idea} onChange={(e) => setIdea(e.target.value)} className="min-h-36 resize-y border-white/10 bg-white/[0.04] text-white placeholder:text-white/20" />
              </div>
              <Button size="lg" className="w-full" onClick={handleGenerate} disabled={!idea.trim()}>Generate Product Blueprint</Button>
            </div>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-8 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              {ORDER.map((step, i) => {
                const config = STEP_CONFIG[step];
                const state = stepStates[step];
                return (
                  <div key={step} className={cn("flex flex-col items-center gap-1 transition-all", currentStep === step && "scale-110")}>
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all", state === "idle" && "bg-white/5 text-white/20", state === "running" && "bg-white/5 text-white ring-1 ring-white/20 animate-pulse", state === "done" && "bg-red-600/30 text-red-300 ring-1 ring-red-500/50", state === "error" && "bg-red-900/30 text-red-400 ring-1 ring-red-500/50")}>
                      {state === "done" ? "\u2713" : state === "error" ? "\u2717" : config.icon}
                    </div>
                    <span className={cn("text-[10px] font-medium whitespace-nowrap hidden sm:block", state === "idle" && "text-white/15", state === "running" && "text-white/60", state === "done" && "text-white/80", state === "error" && "text-red-400")}>{config.label}</span>
                  </div>
                );
              })}
            </div>

            <LiveStreamPanel entries={entries} className="w-full border-white/[0.08] shadow-2xl shadow-black/60" />

            {error && <div className="w-full rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}

            {allDone && <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/60"><span className="inline-block h-2 w-2 rounded-full bg-green-400" />Opening your blueprint...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
