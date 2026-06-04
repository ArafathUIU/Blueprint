import { NextResponse } from "next/server";
import { researchAgent } from "@/lib/agents/researcher";

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();
    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }
    const research = await researchAgent(idea);
    return NextResponse.json({ research });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
