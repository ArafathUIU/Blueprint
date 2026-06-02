import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { prdAgent } from "@/lib/agents/prd-gen";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.research || !project.stories || !project.wireframes) {
    return NextResponse.json(
      { error: "Research, stories, and wireframes must be completed first" },
      { status: 400 }
    );
  }

  try {
    updateProject(id, { status: "generating_prd" });
    const prd = await prdAgent(
      project.idea,
      project.research,
      project.stories,
      project.wireframes
    );
    const updated = updateProject(id, { prd });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    updateProject(id, { status: "error", error: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
