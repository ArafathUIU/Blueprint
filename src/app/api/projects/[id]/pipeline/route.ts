import { NextResponse } from "next/server";
import { getProject } from "@/lib/store";
import { runFullPipeline } from "@/lib/agents/pipeline";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Run pipeline — this is synchronous but we stream progress via SSE-like pattern
  // For now, run all steps and return final result
  try {
    let finalProject = project;

    for await (const event of runFullPipeline(project)) {
      finalProject = event.project;
      if (event.project.status === "error") break;
    }

    return NextResponse.json(finalProject);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
