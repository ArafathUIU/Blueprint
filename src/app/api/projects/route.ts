import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/store";

export async function GET() {
  try {
    const projects = listProjects();
    return NextResponse.json(projects);
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { idea, name } = await req.json();
    if (!idea || typeof idea !== "string") {
      return NextResponse.json(
        { error: "Idea is required" },
        { status: 400 }
      );
    }
    const project = createProject(idea, name || "Untitled Project");
    return NextResponse.json(project, { status: 201 });
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
