import { NextResponse } from "next/server";
import { prdAgent } from "@/lib/agents/prd-gen";
import type { MarketResearch, UserStory, Wireframe } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { idea, research, stories, wireframes } = await req.json();
    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }
    const prd = await prdAgent(
      idea,
      research as MarketResearch,
      (stories || []) as UserStory[],
      (wireframes || []) as Wireframe[]
    );
    return NextResponse.json({ prd });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
