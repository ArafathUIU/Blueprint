"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LiveStreamPanel, type StreamEntry } from "@/components/live-stream-panel";
import { cn } from "@/lib/utils";

// Dynamically import Three.js canvas — SSR incompatible
const ParticleRingCanvas = dynamic(
  () =>
    import("@/components/particle-ring-canvas").then((m) => ({
      default: m.ParticleRingCanvas,
    })),
  { ssr: false }
);

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
  const [ringState, setRingState] = useState<"idle" | "streaming" | "complete" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentStreamStep, setCurrentStreamStep] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateStep = useCallback((step: string, state: StepState) => {
    setStepStates((prev) => ({ ...prev, [step]: state }));
  }, []);

  async function handleGenerate() {
    if (!idea.trim()) return;

    setLoading(true);
    setError(null);
    setEntries([]);
    setStepStates({
      research: "idle",
      stories: "idle",
      wireframes: "idle",
      prd: "idle",
      roadmap: "idle",
    });
    setRingState("streaming");

    try {
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

      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(
        `/api/projects/${project.id}/pipeline/stream`,
        { method: "POST", signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error("Failed to start pipeline");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

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
              case "step_start": {
                const step = event.step as string;
                updateStep(step, "running");
                setCurrentStreamStep(step);
                setEntries((prev) => [
                  ...prev,
                  { type: "header", step },
                ]);
                setRingState("streaming");
                break;
              }

              case "step_start_spinner": {
                const step = event.step as string;
                updateStep(step, "running");
                setCurrentStreamStep(step);
                setEntries((prev) => [
                  ...prev,
                  { type: "spinner", step },
                ]);
                break;
              }

              case "token": {
                setEntries((prev) => [
                  ...prev,
                  {
                    type: "token",
                    step: event.step as string,
                    text: event.text as string,
                  },
                ]);
                break;
              }

              case "step_end": {
                const step = event.step as string;
                updateStep(step, "done");
                setEntries((prev) => [
                  ...prev,
                  { type: "done", step },
                ]);
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
                setRingState("error");
                setEntries((prev) => [
                  ...prev,
                  {
                    type: "error",
                    step,
                    text: event.message as string,
                  },
                ]);
                setError(event.message as string);
                break;
              }

              case "done": {
                setRingState("complete");
                setCurrentStreamStep(null);
                setTimeout(() => {
                  router.push(
                    `/projects/${event.projectId as string}`
                  );
                }, 1500);
                break;
              }
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setRingState("error");
    } finally {
      setLoading(false);
    }
  }

  const completedCount = Object.values(stepStates).filter(
    (s) => s === "done"
  ).length;
  const allDone = completedCount === ORDER.length;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      {/* 3D particle ring background — only during generation */}
      {loading && (
        <div className="absolute inset-0 z-0">
          <ParticleRingCanvas state={ringState} />
        </div>
      )}

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        {/* Form — before generation */}
        {!loading && (
          <>
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                What product are you building?
              </h1>
              <p className="text-muted-foreground">
                Describe your idea. Blueprint will generate research, stories,
                wireframes, a PRD, and a roadmap.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Project Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g. Fitness AI App"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="idea">Product Idea</Label>
                <Textarea
                  id="idea"
                  placeholder="A mobile app that uses AI to generate personalized workout plans based on user biometrics and available equipment..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-36 resize-y"
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
                          state === "idle" &&
                            "bg-white/5 text-white/20 backdrop-blur",
                          state === "running" &&
                            "bg-white/5 text-white ring-1 ring-white/20 animate-pulse backdrop-blur",
                          state === "done" &&
                            "bg-red-600/30 text-red-300 ring-1 ring-red-500/50 backdrop-blur",
                          state === "error" &&
                            "bg-red-900/30 text-red-400 ring-1 ring-red-500/50 backdrop-blur"
                        )}
                      >
                        {state === "done"
                          ? "\u2713"
                          : state === "error"
                            ? "\u2717"
                            : config.icon}
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
                          state === "done"
                            ? "bg-red-500/50"
                            : "bg-white/10"
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
              className="w-full border-white/10 bg-black/80"
            />

            {/* Error message */}
            {error && (
              <div className="w-full rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300 backdrop-blur">
                {error}
              </div>
            )}

            {/* Complete message */}
            {allDone && (
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                All done! Opening your blueprint...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
