import Link from "next/link";
import { getProject } from "@/lib/store";
import { ExportButtons } from "@/components/export-buttons";
import { DeleteButton } from "@/components/delete-button";
import { WireframeWithChat } from "@/components/wireframe-with-chat";
import type { UserStory } from "@/lib/types";

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
      <div className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">{project.name}</h1>
          <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${project.status === "complete" ? "bg-green-600 text-white" : project.status === "error" ? "bg-red-600 text-white" : "bg-zinc-700 text-white"}`}>
            {project.status.replace(/_/g, " ")}
          </span>
          <DeleteButton projectId={project.id} projectName={project.name} redirectTo="/projects" />
        </div>
        <p className="max-w-2xl text-sm text-zinc-400">{project.idea}</p>
        {(project.status === "complete" || project.research || project.stories) && (
          <div className="mt-4">
            <ExportButtons project={project} />
          </div>
        )}
      </div>

      {project.error && (
        <div className="mb-8 rounded-xl bg-red-950 border border-red-800 p-4 text-sm text-red-300">Error: {project.error}</div>
      )}

      {/* Market Research */}
      {project.research && (
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-bold text-red-500">Market Research</h2>
          <p className="mb-5 font-mono text-xs text-zinc-500">Viability Score: {project.research.viabilityScore}/100</p>

          <div className="grid gap-4 sm:grid-cols-4 mb-5">
            <StatCard accent="red" label="TAM" value={project.research.tam} />
            <StatCard accent="amber" label="SAM" value={project.research.sam} />
            <StatCard accent="blue" label="SOM" value={project.research.som} />
            <StatCard accent="green" label="Score" value={`${project.research.viabilityScore}/100`} />
          </div>

          <div className="mb-5 rounded-xl bg-zinc-900 border border-zinc-800 p-5">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">Summary</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">{project.research.summary}</p>
          </div>

          {project.research.trends.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">Key Trends</h4>
              <div className="flex flex-wrap gap-2">
                {project.research.trends.map((t, i) => (
                  <span key={i} className="rounded-full bg-red-950 border border-red-800 px-3 py-1 text-xs text-red-300">{t}</span>
                ))}
              </div>
            </div>
          )}

          {project.research.competitors.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">Competitors</h4>
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Strength</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Weakness</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Our Edge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {project.research.competitors.map((c, i) => (
                      <tr key={i} className="bg-zinc-950 hover:bg-zinc-900">
                        <td className="px-4 py-3 font-semibold text-white">{c.name}</td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">{c.strength}</td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">{c.weakness}</td>
                        <td className="px-4 py-3 text-red-400 text-xs">{c.differentiation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* User Stories */}
      {project.stories && project.stories.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-bold text-amber-500">User Stories</h2>
          <p className="mb-5 font-mono text-xs text-zinc-500">
            {project.stories.length} stories · {project.stories.filter(s => s.priority === "P0").length} P0 · {project.stories.filter(s => s.moscow === "Must").length} Must
          </p>

          <div className="grid gap-3">
            {project.stories.map((story) => {
              const priColor =
                story.priority === "P0" ? "bg-red-900 text-red-300" :
                story.priority === "P1" ? "bg-amber-900 text-amber-300" : "bg-blue-900 text-blue-300";

              return (
                <div key={story.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 ring-1 ring-inset ring-transparent" style={{ boxShadow: story.moscow === "Must" ? "inset 3px 0 0 rgb(239,68,68)" : story.moscow === "Should" ? "inset 3px 0 0 rgb(245,158,11)" : story.moscow === "Could" ? "inset 3px 0 0 rgb(59,130,246)" : "none" }}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-[11px] text-zinc-500">{story.id}</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{story.epic}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${priColor}`}>{story.priority}</span>
                    <span className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{story.moscow}</span>
                  </div>
                  <p className="text-sm text-zinc-200 mb-2">{story.story}</p>
                  {story.acceptanceCriteria.length > 0 && (
                    <ul className="space-y-1">
                      {story.acceptanceCriteria.map((ac, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-zinc-500">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
                          {ac}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Wireframes */}
      {project.wireframes && project.wireframes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-bold text-rose-400">Wireframes</h2>
          <p className="mb-5 font-mono text-xs text-zinc-500">{project.wireframes.length} screens</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {project.wireframes.map((wf) => (
              <WireframeWithChat key={wf.id} wireframe={wf} projectId={project.id} />
            ))}
          </div>
        </section>
      )}

      {/* PRD */}
      {project.prd && (
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-bold text-green-500">PRD</h2>

          <div className="mt-5 space-y-5">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">Problem Statement</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">{project.prd.problemStatement}</p>
            </div>

            {project.prd.goals.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">Goals</h4>
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-900">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Goal</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Metric</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {project.prd.goals.map((g, i) => (
                        <tr key={i} className="bg-zinc-950">
                          <td className="px-4 py-3 text-zinc-200">{g.goal}</td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{g.metric}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-400">{g.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {project.prd.risks.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">Risks & Mitigations</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {project.prd.risks.map((r, i) => (
                    <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                      <p className="text-sm font-semibold text-white mb-2">{r.risk}</p>
                      <div className="flex gap-2 mb-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${r.likelihood === "High" ? "bg-red-900 text-red-300" : r.likelihood === "Medium" ? "bg-amber-900 text-amber-300" : "bg-green-900 text-green-300"}`}>Likelihood: {r.likelihood}</span>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${r.impact === "High" ? "bg-red-900 text-red-300" : r.impact === "Medium" ? "bg-amber-900 text-amber-300" : "bg-green-900 text-green-300"}`}>Impact: {r.impact}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{r.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Roadmap */}
      {project.roadmap && project.roadmap.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 text-xl font-bold text-cyan-500">Development Roadmap</h2>
          <p className="mb-5 font-mono text-xs text-zinc-500">{project.roadmap.length} phases</p>

          <div className="space-y-4">
            {project.roadmap.map((phase, i) => (
              <div key={i} className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-900 text-cyan-400 text-sm font-bold">{i + 1}</span>
                    <h4 className="text-base font-semibold text-white">{phase.phase}</h4>
                  </div>
                  <span className="rounded-full bg-cyan-950 border border-cyan-800 px-3 py-0.5 text-xs text-cyan-300">{phase.timeline}</span>
                </div>
                <ul className="space-y-1.5 mb-3">
                  {phase.deliverables.map((d, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />
                      {d}
                    </li>
                  ))}
                </ul>
                {phase.stories.length > 0 && (
                  <p className="font-mono text-[10px] text-zinc-600">stories: {phase.stories.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {project.status === "draft" && (
        <div className="text-center">
          <Link href={`/api/projects/${project.id}/pipeline`} className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white hover:bg-red-500">
            Run Full Pipeline
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ accent, label, value }: { accent: string; label: string; value: string }) {
  const colors: Record<string, string> = {
    red: "border-red-800 bg-red-950 text-red-300",
    amber: "border-amber-800 bg-amber-950 text-amber-300",
    blue: "border-blue-800 bg-blue-950 text-blue-300",
    green: "border-green-800 bg-green-950 text-green-300",
  };
  return (
    <div className={`rounded-xl border ${colors[accent] || "border-zinc-800 bg-zinc-900 text-zinc-300"} p-4`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">{label}</p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}
