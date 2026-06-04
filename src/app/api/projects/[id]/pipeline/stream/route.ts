import { NextResponse } from "next/server";
import { runFullPipelineStream } from "@/lib/agents/pipeline-stream";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let project: Project;

  try {
    const body = await req.json();
    if (!body.id || !body.idea) {
      return NextResponse.json(
        { error: "Project id and idea are required" },
        { status: 400 }
      );
    }
    project = body as Project;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runFullPipelineStream(project)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", step: "pipeline", message: msg })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
