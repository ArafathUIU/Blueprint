import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { roadmapAgent } from "@/lib/agents/roadmap-gen";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project || !project.stories) {
    return NextResponse.json({ error: "Project or stories not found" }, { status: 400 });
  }
  try {
    updateProject(id, { status: "generating_roadmap" });
    const roadmap = await roadmapAgent(project.stories);
    const updated = updateProject(id, { roadmap });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    updateProject(id, { status: "error", error: String(e) });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
