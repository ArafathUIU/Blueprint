"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveStreamPanel, type StreamEntry } from "@/components/live-stream-panel";
import { AudioWaveform } from "@/components/audio-waveform";
import { cn } from "@/lib/utils";

const ORDER = ["research", "stories", "wireframes", "prd", "roadmap"];

const STEP_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [stepStates, setStepStates] = useState<Record<string, StepState>>({
    research: "idle",
    stories: "idle",
    wireframes: "idle",
    prd: "idle",
    roadmap: "idle",
  });
  const [entries, setEntries] = useState<StreamEntry[]>([]);
  const [waveformActive, setWaveformActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamStep, setCurrentStreamStep] = useState<string | null>(null);
  const streamTextRef = useRef<Record<string, string>>({});

  const updateStep = useCallback((step: string, state: StepState) => {
    setStepStates((prev) => ({ ...prev, [step]: state }));
  }, []);

  async function handleGenerate() {
    if (!idea.trim()) return;

    setLoading(true);
    setError(null);
    setEntries([]);
    setWaveformActive(true);
    setStepStates({
      research: "idle",
      stories: "idle",
      wireframes: "idle",
      prd: "idle",
      roadmap: "idle",
    });

    try {
      // Step 1: Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea.trim(),
          name: name.trim() || idea.trim().slice(0, 50),
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || "Failed to create project");
      }

      const project = await createRes.json();
      setProjectId(project.id);

      // Step 2: Start SSE pipeline
      const sseRes = await fetch(
        `/api/projects/${project.id}/pipeline/stream`,
        { method: "POST" }
      );

      if (!sseRes.ok) {
        const errText = await sseRes.text();
        throw new Error(`Pipeline failed (${sseRes.status}): ${errText}`);
      }

      const reader = sseRes.body?.getReader();
      if (!reader) throw new Error("Response body is not readable (SSE requires Node.js runtime)");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            switch (event.type) {
              case "step_start": {
                const step = event.step as string;
                updateStep(step, "running");
                setCurrentStreamStep(step);
                setEntries((prev) => [...prev, { type: "header", step }]);
                break;
              }

              case "step_start_spinner": {
                const step = event.step as string;
                updateStep(step, "running");
                setCurrentStreamStep(step);
                setEntries((prev) => [...prev, { type: "spinner", step }]);
                break;
              }

              case "token": {
                const step = event.step as string;
                const text = event.text as string;
                streamTextRef.current[step] =
                  (streamTextRef.current[step] || "") + text;

                setEntries((prev) => {
                  const filtered = prev.filter(
                    (e) => !(e.type === "token" && e.step === step)
                  );
                  return [
                    ...filtered,
                    { type: "token", step, text: streamTextRef.current[step] },
                  ];
                });
                break;
              }

              case "step_end": {
                const step = event.step as string;
                updateStep(step, "done");
                setEntries((prev) => [...prev, { type: "done", step }]);
                break;
              }

              case "step_end_spinner": {
                const step = event.step as string;
                updateStep(step, "done");
                setEntries((prev) => {
                  const filtered = prev.filter(
                    (e) => !(e.type === "spinner" && e.step === step)
                  );
                  return [...filtered, { type: "done", step }];
                });
                break;
              }

              case "error": {
                const step = event.step as string;
                updateStep(step, "error");
                setEntries((prev) => [
                  ...prev,
                  { type: "error", step, text: event.message as string },
                ]);
                setError(event.message as string);
                break;
              }

              case "done": {
                setCurrentStreamStep(null);
                setWaveformActive(false);
                setTimeout(() => {
                  router.push(`/projects/${event.projectId as string}`);
                }, 1500);
                break;
              }
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }
    } catch (e: unknown) {
      if ((e as DOMException)?.name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Something went wrong";
      console.error("Pipeline error:", e);
      setError(msg);
    } finally {
      setLoading(false);
      setWaveformActive(false);
    }
  }

  const completedCount = Object.values(stepStates).filter(
    (s) => s === "done"
  ).length;
  const allDone = completedCount === ORDER.length;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      {/* Waveform at bottom during generation */}
      {waveformActive && (
        <div className="absolute bottom-0 left-0 right-0 z-0 h-28 opacity-30">
          <AudioWaveform state="streaming" />
        </div>
      )}

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        {/* Form */}
        {!loading && (
          <>
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                What product are you building?
              </h1>
              <p className="text-white/40">
                Describe your idea. Blueprint will generate research, stories,
                wireframes, a PRD, and a roadmap.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-white/50">Project Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g. Fitness AI App"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/20"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="idea" className="text-white/50">Product Idea</Label>
                <Textarea
                  id="idea"
                  placeholder="A mobile app that uses AI to generate personalized workout plans based on user biometrics and available equipment..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-36 resize-y border-white/10 bg-white/[0.04] text-white placeholder:text-white/20"
                />
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={!idea.trim()}
              >
                Generate Product Blueprint
              </Button>
            </div>
          </>
        )}

        {/* Generation in progress */}
        {loading && (
          <div className="flex flex-col items-center gap-8 pt-8">
            {/* Step indicators */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              {ORDER.map((step, i) => {
                const config = STEP_CONFIG[step];
                const state = stepStates[step];
                const isCurrent = currentStreamStep === step;

                return (
                  <div key={step} className="flex items-center gap-0">
                    <div
                      className={cn(
                        "flex flex-col items-center gap-1 transition-all",
                        isCurrent && "scale-110"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all",
                          state === "idle" && "bg-white/5 text-white/20",
                          state === "running" && "bg-white/5 text-white ring-1 ring-white/20 animate-pulse",
                          state === "done" && "bg-red-600/30 text-red-300 ring-1 ring-red-500/50",
                          state === "error" && "bg-red-900/30 text-red-400 ring-1 ring-red-500/50"
                        )}
                      >
                        {state === "done" ? "\u2713" : state === "error" ? "\u2717" : config.icon}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium whitespace-nowrap hidden sm:block",
                          state === "idle" && "text-white/15",
                          state === "running" && "text-white/60",
                          state === "done" && "text-white/80",
                          state === "error" && "text-red-400"
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    {i < ORDER.length - 1 && (
                      <div
                        className={cn(
                          "mx-1 h-px w-3 sm:w-6 transition-colors",
                          state === "done" ? "bg-red-500/50" : "bg-white/10"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live stream panel */}
            <LiveStreamPanel
              entries={entries}
              className="w-full border-white/[0.08] shadow-2xl shadow-black/60"
            />

            {/* Error */}
            {error && (
              <div className="w-full rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Complete */}
            {allDone && (
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/60">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                Opening your blueprint...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
