import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { storyAgent } from "@/lib/agents/story-gen";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.research) {
    return NextResponse.json(
      { error: "Research must be completed first" },
      { status: 400 }
    );
  }

  try {
    updateProject(id, { status: "generating_stories" });
    const stories = await storyAgent(project.idea, project.research.summary);
    const updated = updateProject(id, { stories });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    updateProject(id, { status: "error", error: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
