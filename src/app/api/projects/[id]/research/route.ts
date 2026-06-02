import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { researchAgent } from "@/lib/agents/researcher";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    updateProject(id, { status: "researching" });
    const research = await researchAgent(project.idea);
    const updated = updateProject(id, { research });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    updateProject(id, { status: "error", error: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
