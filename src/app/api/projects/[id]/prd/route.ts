import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { prdAgent } from "@/lib/agents/prd-gen";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project?.research || !project?.stories || !project?.wireframes) {
    return NextResponse.json({ error: "Research, stories, and wireframes required" }, { status: 400 });
  }
  try {
    updateProject(id, { status: "generating_prd" });
    const prd = await prdAgent(project.idea, project.research, project.stories, project.wireframes);
    const updated = updateProject(id, { prd });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    updateProject(id, { status: "error", error: String(e) });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
