import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENCODE_GO_API_KEY;
  const configured = apiKey && apiKey !== "your-api-key-here";

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    opencodeConfigured: !!configured,
  });
}
