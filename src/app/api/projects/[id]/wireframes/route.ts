import { NextResponse } from "next/server";
import { wireframeAgent } from "@/lib/agents/wireframe-gen";
import type { UserStory } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { stories } = await req.json();
    if (!stories || !Array.isArray(stories)) {
      return NextResponse.json({ error: "Stories array is required" }, { status: 400 });
    }
    const wireframes = await wireframeAgent(stories as UserStory[]);
    return NextResponse.json({ wireframes });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
