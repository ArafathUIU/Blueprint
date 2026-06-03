import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/store";
import { wireframeEditorAgent } from "@/lib/agents/wireframe-editor";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; wfId: string }> }
) {
  const { id, wfId } = await params;
  const project = getProject(id);

  if (!project || !project.wireframes) {
    return NextResponse.json({ error: "Project or wireframes not found" }, { status: 404 });
  }

  const wireframe = project.wireframes.find((w) => w.id === wfId);
  if (!wireframe) {
    return NextResponse.json({ error: "Wireframe not found" }, { status: 404 });
  }

  let command: string;
  try {
    const body = await req.json();
    command = body.command;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!command || typeof command !== "string" || command.trim().length === 0) {
    return NextResponse.json({ error: "Command is required" }, { status: 400 });
  }

  try {
    const updatedSvg = await wireframeEditorAgent(wireframe.svg, command.trim());

    const updatedWireframes = project.wireframes.map((w) =>
      w.id === wfId ? { ...w, svg: updatedSvg } : w
    );

    updateProject(id, { wireframes: updatedWireframes });

    return NextResponse.json({ svg: updatedSvg });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Edit failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
