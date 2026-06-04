import { NextResponse } from "next/server";
import { roadmapAgent } from "@/lib/agents/roadmap-gen";
import type { UserStory } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { stories } = await req.json();
    if (!stories || !Array.isArray(stories)) {
      return NextResponse.json({ error: "Stories array is required" }, { status: 400 });
    }
    const roadmap = await roadmapAgent(stories as UserStory[]);
    return NextResponse.json({ roadmap });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
