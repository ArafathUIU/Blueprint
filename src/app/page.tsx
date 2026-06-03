import Link from "next/link";
import { listProjects } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  let projects: ReturnType<typeof listProjects>;

  try {
    projects = listProjects();
  } catch {
    projects = [];
  }

  const statusLabel: Record<string, string> = {
    draft: "Draft",
    researching: "Researching...",
    generating_stories: "Stories...",
    generating_wireframes: "Wireframes...",
    generating_prd: "PRD...",
    generating_roadmap: "Roadmap...",
    complete: "Complete",
    error: "Error",
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="mb-4 font-sans text-5xl font-bold tracking-tight text-white sm:text-6xl">
          blueprint
        </h1>
        <div className="mb-8 h-1 w-16 rounded-full bg-red-500" />
        <p className="mb-10 max-w-lg text-lg leading-relaxed text-white/50">
          An autonomous AI agent that takes a raw product idea and produces a
          complete product package: market research, competitive analysis, user
          stories, wireframes, PRDs, and development roadmap — all in one
          continuous workflow.
        </p>
        <Link
          href="/new"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-sm font-medium text-white transition-colors hover:bg-red-500"
        >
          Start a new product blueprint
        </Link>
      </section>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <section className="mx-auto w-full max-w-4xl px-6 pb-24">
          <h2 className="mb-6 text-lg font-bold tracking-tight text-white/80">
            Recent Blueprints
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full border-white/5 bg-white/5 backdrop-blur transition-shadow hover:shadow-lg hover:shadow-red-500/5">
                  <CardContent className="flex flex-col gap-2 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-medium text-white">
                        {p.name}
                      </h3>
                      <Badge
                        variant={
                          p.status === "complete" ? "default" : "secondary"
                        }
                        className="shrink-0 text-[10px]"
                      >
                        {statusLabel[p.status] || p.status}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-white/40">
                      {p.idea}
                    </p>
                    <p className="text-[10px] text-white/20">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
