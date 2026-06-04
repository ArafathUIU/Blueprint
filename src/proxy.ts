import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WINDOW = 60_000; // 1 minute
const MAX_REQUESTS = 10;
const store = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  // Only rate-limit API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();
  // Skip health check
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();

  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW });
    return NextResponse.next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 1 minute." },
      { status: 429 }
    );
  }

  entry.count++;
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
