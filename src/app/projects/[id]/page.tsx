import Link from "next/link";
import { getProject } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExportButtons } from "@/components/export-buttons";
import type { UserStory, Wireframe } from "@/lib/types";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground">
          The project you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          Create New Blueprint
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <Badge
            variant={
              project.status === "complete"
                ? "default"
                : project.status === "error"
                  ? "destructive"
                  : "secondary"
            }
          >
            {project.status.replace(/_/g, " ")}
          </Badge>
        </div>
        <p className="max-w-2xl text-white/60">{project.idea}</p>
        {(project.status === "complete" || project.research || project.stories) && (
          <div className="mt-2">
            <ExportButtons project={project} />
          </div>
        )}
      </div>

      {/* Research */}
      {project.research && (
        <>
          <Section title="Market Research">
            <div className="grid gap-6 sm:grid-cols-2">
              <StatCard label="TAM" value={project.research.tam} />
              <StatCard label="SAM" value={project.research.sam} />
              <StatCard label="SOM" value={project.research.som} />
              <StatCard
                label="Viability Score"
                value={`${project.research.viabilityScore}/100`}
              />
            </div>

            {project.research.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {project.research.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Trends */}
            {project.research.trends.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Key Trends</h3>
                <div className="flex flex-wrap gap-2">
                  {project.research.trends.map((t, i) => (
                    <Badge key={i} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Competitors */}
            {project.research.competitors.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold">Competitors</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Company</th>
                        <th className="px-4 py-2 text-left font-medium">Strength</th>
                        <th className="px-4 py-2 text-left font-medium">Weakness</th>
                        <th className="px-4 py-2 text-left font-medium">Our Edge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.research.competitors.map((c, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2 font-medium">{c.name}</td>
                          <td className="px-4 py-2 text-muted-foreground">{c.strength}</td>
                          <td className="px-4 py-2 text-muted-foreground">{c.weakness}</td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {c.differentiation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Section>
          <Separator />
        </>
      )}

      {/* User Stories */}
      {project.stories && (
        <>
          <Section title="User Stories">
            <StoriesTable stories={project.stories} />
          </Section>
          <Separator />
        </>
      )}

      {/* Wireframes */}
      {project.wireframes && project.wireframes.length > 0 && (
        <>
          <Section title="Wireframes">
            <div className="grid gap-6 sm:grid-cols-2">
              {project.wireframes.map((wf) => (
                <WireframeCard key={wf.id} wireframe={wf} />
              ))}
            </div>
          </Section>
          <Separator />
        </>
      )}

      {/* PRD */}
      {project.prd && (
        <>
          <Section title="PRD">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Problem Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {project.prd.problemStatement}
                  </p>
                </CardContent>
              </Card>

              {project.prd.goals.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Goal</th>
                        <th className="px-4 py-2 text-left font-medium">Metric</th>
                        <th className="px-4 py-2 text-left font-medium">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.prd.goals.map((g, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{g.goal}</td>
                          <td className="px-4 py-2 text-muted-foreground">{g.metric}</td>
                          <td className="px-4 py-2 font-medium">{g.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {project.prd.risks.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Risk</th>
                        <th className="px-4 py-2 text-left font-medium">Likelihood</th>
                        <th className="px-4 py-2 text-left font-medium">Impact</th>
                        <th className="px-4 py-2 text-left font-medium">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.prd.risks.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2 font-medium">{r.risk}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{r.likelihood}</Badge>
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{r.impact}</Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{r.mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Section>
          <Separator />
        </>
      )}

      {/* Roadmap */}
      {project.roadmap && (
        <Section title="Development Roadmap">
          <div className="flex flex-col gap-4">
            {project.roadmap.map((phase, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{phase.phase}</CardTitle>
                    <Badge variant="secondary">{phase.timeline}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      Deliverables
                    </h4>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {phase.deliverables.map((d, j) => (
                        <li key={j}>{d}</li>
                      ))}
                    </ul>
                    {phase.stories.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Stories: {phase.stories.join(", ")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* CTA if not complete */}
      {project.status === "draft" && (
        <div className="mt-8 text-center">
          <Link
            href={`/api/projects/${project.id}/pipeline`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Run Full Pipeline
          </Link>
        </div>
      )}

      {project.error && (
        <Card className="mt-8 border-destructive/30 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{project.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-8">
      <h2 className="mb-6 text-xl font-bold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StoriesTable({ stories }: { stories: UserStory[] }) {
  const priorityColor: Record<string, string> = {
    P0: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    P1: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    P2: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const moscowColor: Record<string, string> = {
    Must: "border-red-300 bg-red-50 dark:bg-red-950/20",
    Should: "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20",
    Could: "border-blue-300 bg-blue-50 dark:bg-blue-950/20",
    Wont: "border-gray-300 bg-gray-50 dark:bg-gray-800",
  };

  return (
    <div className="flex flex-col gap-3">
      {stories.map((story) => (
        <Card key={story.id} className={moscowColor[story.moscow] || ""}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    {story.id}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {story.epic}
                  </Badge>
                  <Badge
                    className={
                      priorityColor[story.priority] || ""
                    }
                  >
                    {story.priority}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {story.moscow}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{story.story}</p>
                {story.acceptanceCriteria.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                    {story.acceptanceCriteria.map((ac, i) => (
                      <li key={i}>{ac}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WireframeCard({ wireframe }: { wireframe: Wireframe }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{wireframe.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">{wireframe.description}</p>
          <div
            className="flex justify-center rounded-lg border bg-muted/30 p-2"
            dangerouslySetInnerHTML={{ __html: wireframe.svg }}
          />
          {wireframe.annotations.length > 0 && (
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {wireframe.annotations.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
