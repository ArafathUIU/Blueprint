import Link from "next/link";
import { getProject } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
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
        <Link href="/new" className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white">
          Create New Blueprint
        </Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">{project.name}</h1>
          <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${project.status === "complete" ? "bg-green-500/20 text-green-300" : project.status === "error" ? "bg-red-500/20 text-red-300" : "bg-white/10 text-white/50"}`}>
            {project.status.replace(/_/g, " ")}
          </span>
        </div>
        <p className="max-w-2xl text-white/50 text-sm">{project.idea}</p>
        {(project.status === "complete" || project.research || project.stories) && (
          <div className="mt-3">
            <ExportButtons project={project} />
          </div>
        )}
      </div>

      {project.error && (
        <div className="mb-8 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">{project.error}</div>
      )}

      {/* Research */}
      {project.research && (
        <Section color="red" title="Market Research" subtitle={`Viability Score: ${project.research.viabilityScore}/100`}>
          <div className="grid gap-4 sm:grid-cols-4">
            <MiniStat color="red" label="TAM" value={project.research.tam} />
            <MiniStat color="amber" label="SAM" value={project.research.sam} />
            <MiniStat color="blue" label="SOM" value={project.research.som} />
            <MiniStat color="green" label="Score" value={`${project.research.viabilityScore}/100`} />
          </div>

          <InfoBox color="red" title="Summary">
            {project.research.summary}
          </InfoBox>

          {project.research.trends.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">Trends</h4>
              <div className="flex flex-wrap gap-2">
                {project.research.trends.map((t, i) => (
                  <span key={i} className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs text-red-300">{t}</span>
                ))}
              </div>
            </div>
          )}

          {project.research.competitors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">Competitors</h4>
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Strength</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Weakness</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Our Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {project.research.competitors.map((c, i) => (
                      <tr key={i} className="hover:bg-white/[0.01]">
                        <td className="px-4 py-3 font-medium text-white/80">{c.name}</td>
                        <td className="px-4 py-3 text-white/40 text-xs">{c.strength}</td>
                        <td className="px-4 py-3 text-white/40 text-xs">{c.weakness}</td>
                        <td className="px-4 py-3 text-red-300/60 text-xs">{c.differentiation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Stories */}
      {project.stories && project.stories.length > 0 && (
        <Section color="amber" title="User Stories" subtitle={`${project.stories.length} stories · ${project.stories.filter(s => s.priority === "P0").length} P0 · ${project.stories.filter(s => s.moscow === "Must").length} Must`}>
          <div className="grid gap-3">
            {project.stories.map((story) => {
              const borderColor = story.moscow === "Must" ? "border-l-red-500" : story.moscow === "Should" ? "border-l-amber-500" : story.moscow === "Could" ? "border-l-blue-500" : "border-l-white/10";
              return (
                <div key={story.id} className={`rounded-xl bg-white/[0.02] border border-white/5 ${borderColor} border-l-4 p-4 hover:bg-white/[0.04] transition-colors`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-[11px] text-white/20">{story.id}</span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/40">{story.epic}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${story.priority === "P0" ? "bg-red-500/20 text-red-300" : story.priority === "P1" ? "bg-amber-500/20 text-amber-300" : "bg-blue-500/20 text-blue-300"}`}>{story.priority}</span>
                    <span className="rounded border border-white/5 px-2 py-0.5 text-[10px] text-white/30">{story.moscow}</span>
                  </div>
                  <p className="text-sm text-white/70">{story.story}</p>
                  {story.acceptanceCriteria.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {story.acceptanceCriteria.map((ac, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-white/30">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/40" />
                          {ac}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Wireframes */}
      {project.wireframes && project.wireframes.length > 0 && (
        <Section color="purple" title="Wireframes" subtitle={`${project.wireframes.length} screens`}>
          <div className="grid gap-4 sm:grid-cols-2">
            {project.wireframes.map((wf) => (
              <div key={wf.id} className="rounded-xl bg-white/[0.02] border border-white/5 p-5 hover:border-purple-500/20 transition-colors">
                <h4 className="text-sm font-semibold text-white/70 mb-1">{wf.title}</h4>
                <p className="text-xs text-white/30 mb-3">{wf.description}</p>
                <div className="rounded-lg bg-white p-2 flex justify-center" dangerouslySetInnerHTML={{ __html: wf.svg }} />
                {wf.annotations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {wf.annotations.map((a, j) => (
                      <span key={j} className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* PRD */}
      {project.prd && (
        <Section color="green" title="PRD">
          <InfoBox color="green" title="Problem">
            {project.prd.problemStatement}
          </InfoBox>

          {project.prd.goals.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-2">Goals</h4>
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/[0.03]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Goal</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Metric</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {project.prd.goals.map((g, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-white/70">{g.goal}</td>
                        <td className="px-4 py-3 text-white/30 text-xs">{g.metric}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-300">{g.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {project.prd.risks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-2">Risks</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {project.prd.risks.map((r, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white/70">{r.risk}</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${r.likelihood === "High" ? "bg-red-500/20 text-red-300" : r.likelihood === "Medium" ? "bg-amber-500/20 text-amber-300" : "bg-green-500/20 text-green-300"}`}>{r.likelihood}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${r.impact === "High" ? "bg-red-500/20 text-red-300" : r.impact === "Medium" ? "bg-amber-500/20 text-amber-300" : "bg-green-500/20 text-green-300"}`}>{r.impact}</span>
                    </div>
                    <p className="text-xs text-white/30">{r.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Roadmap */}
      {project.roadmap && project.roadmap.length > 0 && (
        <Section color="cyan" title="Development Roadmap" subtitle={`${project.roadmap.length} phases`}>
          <div className="space-y-4">
            {project.roadmap.map((phase, i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-5 hover:border-cyan-500/20 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-bold">{i + 1}</span>
                    <h4 className="text-base font-semibold text-white/80">{phase.phase}</h4>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-0.5 text-xs text-cyan-300">{phase.timeline}</span>
                </div>
                <ul className="space-y-1 mb-3">
                  {phase.deliverables.map((d, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500/50" />
                      {d}
                    </li>
                  ))}
                </ul>
                {phase.stories.length > 0 && (
                  <p className="font-mono text-[10px] text-white/15">stories: {phase.stories.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {project.status === "draft" && (
        <div className="mt-8 text-center">
          <Link href={`/api/projects/${project.id}/pipeline`} className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white">
            Run Full Pipeline
          </Link>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function Section({ color, title, subtitle, children }: { color: string; title: string; subtitle?: string; children: React.ReactNode }) {
  const colors: Record<string, string> = { red: "from-red-500/5 to-transparent", amber: "from-amber-500/5 to-transparent", blue: "from-blue-500/5 to-transparent", green: "from-green-500/5 to-transparent", purple: "from-purple-500/5 to-transparent", cyan: "from-cyan-500/5 to-transparent" };
  const borders: Record<string, string> = { red: "border-red-500/10", amber: "border-amber-500/10", blue: "border-blue-500/10", green: "border-green-500/10", purple: "border-purple-500/10", cyan: "border-cyan-500/10" };
  const texts: Record<string, string> = { red: "text-red-400", amber: "text-amber-400", blue: "text-blue-400", green: "text-green-400", purple: "text-purple-400", cyan: "text-cyan-400" };

  return (
    <section className={`mb-10 rounded-2xl bg-gradient-to-b ${colors[color] || ""} border ${borders[color] || "border-white/5"} p-6 sm:p-8`}>
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${texts[color] || "text-white"}`}>{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-white/25 font-mono">{subtitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function MiniStat({ color, label, value }: { color: string; label: string; value: string }) {
  const colors: Record<string, string> = { red: "border-red-500/20 text-red-300", amber: "border-amber-500/20 text-amber-300", blue: "border-blue-500/20 text-blue-300", green: "border-green-500/20 text-green-300" };
  return (
    <div className={`rounded-xl border ${colors[color]?.split(" ")[0] || "border-white/5"} bg-white/[0.02] p-4`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/20">{label}</p>
      <p className={`mt-1 text-base font-bold ${colors[color]?.split(" ")[1] || "text-white"}`}>{value}</p>
    </div>
  );
}

function InfoBox({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  const texts: Record<string, string> = { red: "text-red-400", amber: "text-amber-400", green: "text-green-400", cyan: "text-cyan-400" };
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5">
      <h4 className={`text-xs font-semibold uppercase tracking-wider ${texts[color] || "text-white/50"} mb-2`}>{title}</h4>
      <p className="text-sm text-white/50 leading-relaxed">{children}</p>
    </div>
  );
}
