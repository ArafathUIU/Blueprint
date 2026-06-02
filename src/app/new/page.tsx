"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STEP_CONFIG: Record<string, { label: string; icon: string; color: string; messages: string[] }> = {
  research: {
    label: "Market Research",
    icon: "\u{1F50D}",
    color: "text-blue-600",
    messages: [
      "Scanning market trends...",
      "Analyzing competitors...",
      "Sizing the market opportunity...",
      "Identifying target personas...",
      "Compiling research report...",
    ],
  },
  stories: {
    label: "User Stories",
    icon: "\u{1F4CB}",
    color: "text-amber-600",
    messages: [
      "Identifying epics and themes...",
      "Drafting user stories with personas...",
      "Writing acceptance criteria...",
      "Prioritizing stories (MoSCoW)...",
      "Finalizing story backlog...",
    ],
  },
  wireframes: {
    label: "Wireframes",
    icon: "\u{1F3A8}",
    color: "text-purple-600",
    messages: [
      "Designing screen layouts...",
      "Placing UI components...",
      "Creating user flows...",
      "Adding annotations...",
      "Finalizing wireframe set...",
    ],
  },
  prd: {
    label: "PRD Document",
    icon: "\u{1F4C4}",
    color: "text-green-600",
    messages: [
      "Drafting problem statement...",
      "Defining success metrics...",
      "Enumerating key features...",
      "Assessing risks and dependencies...",
      "Assembling final PRD...",
    ],
  },
  roadmap: {
    label: "Roadmap",
    icon: "\u{1F5FA}\uFE0F",
    color: "text-cyan-600",
    messages: [
      "Planning MVP scope...",
      "Scheduling phases and sprints...",
      "Estimating effort and timeline...",
      "Assigning stories to phases...",
      "Finalizing development plan...",
    ],
  },
};

const ORDER = ["research", "stories", "wireframes", "prd", "roadmap"];

export default function NewProjectPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [failedStep, setFailedStep] = useState<string | null>(null);
  const [agentMessage, setAgentMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const messageIndexRef = useRef<Record<string, number>>({});
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, []);

  function startMessageCycle(step: string) {
    const config = STEP_CONFIG[step];
    if (!config) return;
    messageIndexRef.current[step] = 0;
    setAgentMessage(config.messages[0]);

    if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    messageIntervalRef.current = setInterval(() => {
      const idx = (messageIndexRef.current[step] || 0) + 1;
      const msgs = config.messages;
      if (idx < msgs.length) {
        messageIndexRef.current[step] = idx;
        setAgentMessage(msgs[idx]);
      }
    }, 2500);
  }

  function stopMessageCycle() {
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
  }

  async function handleGenerate() {
    if (!idea.trim()) return;

    setLoading(true);
    setError(null);
    setFailedStep(null);
    setCompletedSteps(new Set());
    stopMessageCycle();

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

      for (const step of ORDER) {
        setCurrentStep(step);
        startMessageCycle(step);

        const res = await fetch(`/api/projects/${project.id}/${step}`, {
          method: "POST",
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Failed at ${step}`);
        }

        stopMessageCycle();
        setCompletedSteps((prev) => new Set(prev).add(step));
      }

      setCurrentStep(null);
      setAgentMessage("All done! Redirecting...");

      setTimeout(() => {
        stopMessageCycle();
        router.push(`/projects/${project.id}`);
      }, 1000);
    } catch (e) {
      stopMessageCycle();
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setFailedStep(currentStep);
    } finally {
      setLoading(false);
    }
  }

  const isRunning = loading && currentStep;
  const totalSteps = ORDER.length;
  const completedCount = completedSteps.size;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          What product are you building?
        </h1>
        <p className="text-muted-foreground">
          Describe your product idea. Blueprint will generate research, stories,
          wireframes, a PRD, and a development roadmap.
        </p>
      </div>

      {!loading && (
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
      )}

      {loading && (
        <div className="flex flex-col items-center gap-8 rounded-xl border border-border bg-card p-8">
          {/* Progress bar */}
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {completedCount} of {totalSteps} steps complete
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
            {ORDER.map((step, i) => {
              const config = STEP_CONFIG[step];
              const isCurrent = currentStep === step;
              const isDone = completedSteps.has(step);
              const isFailed = failedStep === step;

              return (
                <div key={step} className="flex items-center gap-0">
                  <div
                    className={cn(
                      "flex flex-col items-center gap-1.5 transition-all",
                      isCurrent && "scale-110"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all",
                        !isDone && !isCurrent && "bg-muted text-muted-foreground/40",
                        isDone && "bg-primary text-primary-foreground",
                        isCurrent && "bg-primary/10 text-primary ring-2 ring-primary animate-pulse",
                        isFailed && "bg-destructive/10 text-destructive ring-2 ring-destructive"
                      )}
                    >
                      {isDone ? "\u2713" : isFailed ? "\u2717" : config.icon}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium whitespace-nowrap hidden sm:block",
                        isDone && "text-foreground",
                        isCurrent && config.color,
                        !isDone && !isCurrent && "text-muted-foreground/40"
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                  {i < ORDER.length - 1 && (
                    <div
                      className={cn(
                        "mx-1.5 h-0.5 w-4 sm:w-8 transition-colors",
                        isDone ? "bg-primary" : "bg-muted-foreground/20"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Spinner + agent thinking */}
          {isRunning && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-primary"
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
                <span className="text-sm font-medium text-muted-foreground">
                  {STEP_CONFIG[currentStep!]?.label || "Working..."}
                </span>
              </div>
              {agentMessage && (
                <p className="text-xs text-muted-foreground/70 animate-pulse">
                  {agentMessage}
                </p>
              )}
            </div>
          )}

          {failedStep && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-destructive">
                Failed at: {STEP_CONFIG[failedStep]?.label}
              </p>
            </div>
          )}

          {error && (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {completedCount === totalSteps && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span>{'\u2705'}</span>
              All steps complete! Redirecting to your blueprint...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
