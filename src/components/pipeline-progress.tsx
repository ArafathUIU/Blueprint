"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { key: "research", label: "Market Research", icon: "🔍" },
  { key: "stories", label: "User Stories", icon: "📋" },
  { key: "wireframes", label: "Wireframes", icon: "🎨" },
  { key: "prd", label: "PRD Document", icon: "📄" },
  { key: "roadmap", label: "Roadmap", icon: "🗺️" },
] as const;

type StepStatus = "idle" | "running" | "done" | "error";

interface PipelineProgressProps {
  steps: Record<string, StepStatus>;
}

function StepDot({ status }: { status: StepStatus }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm transition-all",
        status === "idle" && "border-muted-foreground/20 bg-muted text-muted-foreground/40",
        status === "running" && "border-primary bg-primary/10 text-primary animate-pulse",
        status === "done" && "border-primary bg-primary text-primary-foreground",
        status === "error" && "border-destructive bg-destructive/10 text-destructive"
      )}
    >
      {status === "done" ? "✓" : status === "error" ? "✗" : "·"}
    </div>
  );
}

export function PipelineProgress({ steps }: PipelineProgressProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const status = steps[step.key] || "idle";
        return (
          <div key={step.key} className="flex items-center gap-0">
            <div className="flex flex-col items-center gap-1">
              <StepDot status={status} />
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap hidden sm:block",
                  status === "idle" && "text-muted-foreground/40",
                  status === "running" && "text-primary",
                  status === "done" && "text-foreground",
                  status === "error" && "text-destructive"
                )}
              >
                {step.label}
              </span>
              <span className="text-xs sm:hidden">{step.icon}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-6 sm:w-12 transition-colors",
                  status === "done"
                    ? "bg-primary"
                    : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { STEPS };
