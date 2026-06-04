import { NextResponse } from "next/server";
import { storyAgent } from "@/lib/agents/story-gen";

export async function POST(req: Request) {
  try {
    const { idea, researchSummary } = await req.json();
    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }
    const stories = await storyAgent(idea, researchSummary || "");
    return NextResponse.json({ stories });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
