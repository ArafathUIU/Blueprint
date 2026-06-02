import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { wireframeAgent } from "@/lib/agents/wireframe-gen";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.stories) {
    return NextResponse.json(
      { error: "Stories must be completed first" },
      { status: 400 }
    );
  }

  try {
    updateProject(id, { status: "generating_wireframes" });
    const wireframes = await wireframeAgent(project.stories);
    const updated = updateProject(id, { wireframes });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    updateProject(id, { status: "error", error: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
