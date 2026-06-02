"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PipelineProgress, STEPS } from "@/components/pipeline-progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StepStatus = "idle" | "running" | "done" | "error";

export default function NewProjectPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    research: "idle",
    stories: "idle",
    wireframes: "idle",
    prd: "idle",
    roadmap: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!idea.trim()) return;

    setLoading(true);
    setError(null);
    setSteps({
      research: "running",
      stories: "idle",
      wireframes: "idle",
      prd: "idle",
      roadmap: "idle",
    });

    try {
      // Create project
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

      // Run pipeline step by step
      const stepEndpoints = ["research", "stories", "wireframes", "prd", "roadmap"];

      for (const step of stepEndpoints) {
        setSteps((prev) => ({ ...prev, [step]: "running" }));

        const res = await fetch(`/api/projects/${project.id}/${step}`, {
          method: "POST",
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Failed at ${step}`);
        }

        setSteps((prev) => ({ ...prev, [step]: "done" }));
      }

      // Navigate to project view
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setSteps((prev) => {
        const currentRunning = Object.entries(prev).find(
          ([, v]) => v === "running"
        );
        if (currentRunning) {
          return { ...prev, [currentRunning[0]]: "error" };
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          What product are you building?
        </h1>
        <p className="text-muted-foreground">
          Describe your product idea below. Blueprint will generate market
          research, user stories, wireframes, a PRD, and a development roadmap.
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
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="idea">Product Idea</Label>
          <Textarea
            id="idea"
            placeholder="A mobile app that uses AI to generate personalized workout plans based on user biometrics and available equipment..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading}
            className="min-h-36 resize-y"
          />
        </div>

        {!loading ? (
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={!idea.trim()}
          >
            Generate Product Blueprint
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-6 rounded-xl border border-border p-6">
            <PipelineProgress steps={steps} />
            <p className="text-sm text-muted-foreground">
              {projectId
                ? "Building your blueprint..."
                : "Creating project..."}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
