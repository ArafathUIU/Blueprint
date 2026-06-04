import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { wireframeAgent } from "@/lib/agents/wireframe-gen";

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
    updateProject(id, { status: "generating_wireframes" });
    const wireframes = await wireframeAgent(project.stories);
    const updated = updateProject(id, { wireframes });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    updateProject(id, { status: "error", error: String(e) });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
