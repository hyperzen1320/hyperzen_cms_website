import { NextResponse } from "next/server";
import { searchSite } from "@/lib/queries";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpFrom } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headerList = await headers();
  const ip = clientIpFrom(headerList) ?? "unknown";
  const limit = rateLimit(`search:${ip}`, 60, 60_000);
  if (!limit.success) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.trim().length < 2) return NextResponse.json({ results: [] });

  const results = await searchSite(query, 6);
  return NextResponse.json({ results });
}
