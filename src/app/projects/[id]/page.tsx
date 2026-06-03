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
        <h1 className="text-2xl font-bold text-white">Project Not Found</h1>
        <p className="text-white/40">
          The project you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white"
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
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {project.name}
          </h1>
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
        <p className="max-w-2xl text-white/50">{project.idea}</p>
        {(project.status === "complete" || project.research || project.stories) && (
          <div className="mt-2">
            <ExportButtons project={project} />
          </div>
        )}
      </div>

      {project.error && (
        <div className="mb-8 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-300 backdrop-blur">
          {project.error}
        </div>
      )}

      {/* Research */}
      {project.research && (
        <>
          <Section title="Market Research">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="TAM" value={project.research.tam} />
              <StatCard label="SAM" value={project.research.sam} />
              <StatCard label="SOM" value={project.research.som} />
              <StatCard
                label="Viability Score"
                value={`${project.research.viabilityScore}/100`}
              />
            </div>

            {project.research.summary && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur">
                <h3 className="mb-2 text-sm font-semibold text-white/70">Summary</h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {project.research.summary}
                </p>
              </div>
            )}

            {project.research.trends.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-white/70">Key Trends</h3>
                <div className="flex flex-wrap gap-2">
                  {project.research.trends.map((t, i) => (
                    <Badge key={i} variant="outline" className="border-white/10 text-white/60">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {project.research.competitors.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white/70">Competitors</h3>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.03]">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Company</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Strength</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Weakness</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Our Edge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.research.competitors.map((c, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-4 py-3 font-medium text-white/80">{c.name}</td>
                          <td className="px-4 py-3 text-white/40">{c.strength}</td>
                          <td className="px-4 py-3 text-white/40">{c.weakness}</td>
                          <td className="px-4 py-3 text-white/50">{c.differentiation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Section>
          <GlassSeparator />
        </>
      )}

      {/* User Stories */}
      {project.stories && project.stories.length > 0 && (
        <>
          <Section title="User Stories">
            <StoriesTable stories={project.stories} />
          </Section>
          <GlassSeparator />
        </>
      )}

      {/* Wireframes */}
      {project.wireframes && project.wireframes.length > 0 && (
        <>
          <Section title="Wireframes">
            <div className="grid gap-4 sm:grid-cols-2">
              {project.wireframes.map((wf) => (
                <WireframeCard key={wf.id} wireframe={wf} />
              ))}
            </div>
          </Section>
          <GlassSeparator />
        </>
      )}

      {/* PRD */}
      {project.prd && (
        <>
          <Section title="PRD">
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur">
                <h3 className="mb-2 text-sm font-semibold text-white/70">
                  Problem Statement
                </h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {project.prd.problemStatement}
                </p>
              </div>

              {project.prd.goals.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.03]">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Goal</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Metric</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.prd.goals.map((g, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-4 py-3 text-white/80">{g.goal}</td>
                          <td className="px-4 py-3 text-white/40">{g.metric}</td>
                          <td className="px-4 py-3 font-medium text-white/70">{g.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {project.prd.risks.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.03]">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Risk</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Likelihood</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Impact</th>
                        <th className="px-4 py-3 text-left font-medium text-white/60">Mitigation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.prd.risks.map((r, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="px-4 py-3 font-medium text-white/80">{r.risk}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-white/10 text-white/60">
                              {r.likelihood}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-white/10 text-white/60">
                              {r.impact}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-white/40">{r.mitigation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Section>
          <GlassSeparator />
        </>
      )}

      {/* Roadmap */}
      {project.roadmap && project.roadmap.length > 0 && (
        <Section title="Development Roadmap">
          <div className="flex flex-col gap-4">
            {project.roadmap.map((phase, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white/80">{phase.phase}</h3>
                  <Badge variant="secondary" className="border-white/10 bg-white/5 text-white/50">
                    {phase.timeline}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold uppercase text-white/30">Deliverables</h4>
                  <ul className="list-inside list-disc text-sm text-white/50">
                    {phase.deliverables.map((d, j) => (
                      <li key={j}>{d}</li>
                    ))}
                  </ul>
                  {phase.stories.length > 0 && (
                    <p className="mt-2 font-mono text-xs text-white/20">
                      stories: {phase.stories.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {project.status === "draft" && (
        <div className="mt-8 text-center">
          <Link
            href={`/api/projects/${project.id}/pipeline`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white"
          >
            Run Full Pipeline
          </Link>
        </div>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-8">
      <h2 className="mb-6 text-xl font-bold tracking-tight text-white/90">{title}</h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function GlassSeparator() {
  return <Separator className="bg-white/5" />;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur">
      <p className="text-xs font-medium text-white/30">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function StoriesTable({ stories }: { stories: UserStory[] }) {
  const moscowBorder: Record<string, string> = {
    Must: "border-red-500/20",
    Should: "border-amber-500/20",
    Could: "border-blue-500/20",
    Wont: "border-white/5",
  };

  return (
    <div className="flex flex-col gap-3">
      {stories.map((story) => (
        <div
          key={story.id}
          className={`rounded-xl border ${moscowBorder[story.moscow] || "border-white/5"} bg-white/[0.02] p-4 backdrop-blur`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs text-white/30">{story.id}</span>
            <Badge variant="secondary" className="border-white/10 bg-white/5 text-white/50 text-[10px]">
              {story.epic}
            </Badge>
            <Badge className="bg-red-600/20 text-red-300 text-[10px]">{story.priority}</Badge>
            <Badge variant="outline" className="border-white/10 text-white/40 text-[10px]">
              {story.moscow}
            </Badge>
          </div>
          <p className="text-sm text-white/80">{story.story}</p>
          {story.acceptanceCriteria.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-white/40">
              {story.acceptanceCriteria.map((ac, i) => (
                <li key={i}>{ac}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function WireframeCard({ wireframe }: { wireframe: Wireframe }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur">
      <h3 className="mb-2 text-sm font-semibold text-white/70">{wireframe.title}</h3>
      <p className="mb-3 text-xs text-white/40">{wireframe.description}</p>
      <div
        className="flex justify-center rounded-lg border border-white/5 bg-white/[0.03] p-2"
        dangerouslySetInnerHTML={{ __html: wireframe.svg }}
      />
      {wireframe.annotations.length > 0 && (
        <ul className="mt-3 list-inside list-disc text-xs text-white/30">
          {wireframe.annotations.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
