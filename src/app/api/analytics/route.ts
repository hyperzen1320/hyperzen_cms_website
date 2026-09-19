import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { clientIpFrom } from "@/lib/auth";
import { analyticsEventSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * First-party analytics collector. Stores no cookies and no personal data —
 * just the page, the event type and campaign attribution.
 */
export async function POST(request: Request) {
  const headerList = await headers();
  const ip = clientIpFrom(headerList) ?? "unknown";
  const limit = rateLimit(`analytics:${ip}`, 120, 60_000);
  if (!limit.success) return new NextResponse(null, { status: 204 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = analyticsEventSchema.safeParse(payload);
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  const event = parsed.data;
  if (event.path?.startsWith("/admin")) return new NextResponse(null, { status: 204 });

  await prisma.analyticsEvent
    .create({
      data: {
        type: event.type,
        path: event.path ?? null,
        label: event.label ?? null,
        value: event.value ?? null,
        referrer: event.referrer ?? null,
        utmSource: event.utmSource ?? null,
        utmMedium: event.utmMedium ?? null,
        utmCampaign: event.utmCampaign ?? null,
        sessionId: event.sessionId ?? null,
        device: event.device ?? null,
      },
    })
    .catch(() => undefined);

  return new NextResponse(null, { status: 204 });
}
