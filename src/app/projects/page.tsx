import Link from "next/link";
import { listProjects } from "@/lib/store";
import { DeleteButton } from "@/components/delete-button";

const STATUS_COLORS: Record<string, string> = {
  complete: "bg-green-600 text-white", error: "bg-red-600 text-white",
  draft: "bg-zinc-700 text-zinc-300", researching: "bg-blue-600 text-white",
  generating_stories: "bg-amber-600 text-white", generating_wireframes: "bg-purple-600 text-white",
  generating_prd: "bg-green-700 text-white", generating_roadmap: "bg-cyan-600 text-white",
};

const STATUS_LABELS: Record<string, string> = {
  complete: "Complete", error: "Error", draft: "Draft",
  researching: "Researching", generating_stories: "Stories",
  generating_wireframes: "Wireframes", generating_prd: "PRD", generating_roadmap: "Roadmap",
};

export default function ProjectsListPage() {
  let projects: ReturnType<typeof listProjects>;
  try { projects = listProjects(); } catch { projects = []; }

  if (projects.length === 0) {
    return (
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-24 text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800"><span className="text-2xl">{'\u{1F4CB}'}</span></div>
        <h2 className="text-xl font-bold text-white">No blueprints yet</h2>
        <p className="text-sm text-zinc-400">Generate your first product blueprint and it will appear here.</p>
        <Link href="/new" className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-6 text-sm font-medium text-white hover:bg-red-500">Create your first blueprint</Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Your Blueprints</h1><p className="mt-1 text-sm text-zinc-500">{projects.length} project{projects.length !== 1 ? "s" : ""}</p></div>
        <Link href="/new" className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-500">New Blueprint</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="group block">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/80">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">{p.name}</h3>
                <div className="flex items-center gap-1">
                  <DeleteButton projectId={p.id} projectName={p.name} />
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[p.status] || "bg-zinc-700 text-zinc-300"}`}>{STATUS_LABELS[p.status] || p.status}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{p.idea}</p>
              <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                <span>{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {p.research && <span className="text-red-500/60">{'\u25CF'} Research</span>}
                {p.stories && <span className="text-amber-500/60">{'\u25CF'} Stories</span>}
                {p.wireframes && <span className="text-purple-500/60">{'\u25CF'} Wireframes</span>}
                {p.prd && <span className="text-green-500/60">{'\u25CF'} PRD</span>}
                {p.roadmap && <span className="text-cyan-500/60">{'\u25CF'} Roadmap</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
