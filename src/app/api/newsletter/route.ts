import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { assertSameOrigin, clientIpFrom } from "@/lib/auth";
import { newsletterSchema } from "@/lib/validation";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { newsletterTemplate, sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/queries";
import { notify } from "@/lib/notifications";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await assertSameOrigin())) {
    return NextResponse.json({ ok: false, message: "Invalid request origin." }, { status: 403 });
  }

  const headerList = await headers();
  const ip = clientIpFrom(headerList) ?? "unknown";
  const limit = rateLimit(`newsletter:${ip}`, 6, 10 * 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Enter a valid email address." },
      { status: 422 },
    );
  }

  const { email, name, source, company_website } = parsed.data;
  if (company_website) return NextResponse.json({ ok: true, message: "You're subscribed." });

  const normalised = email.toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalised } });

  if (existing?.isSubscribed) {
    return NextResponse.json({ ok: true, message: "You're already on the list." });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: normalised },
    update: { isSubscribed: true, name: name || existing?.name || null },
    create: {
      email: normalised,
      name: name || null,
      source: source || "website",
      isSubscribed: true,
      confirmedAt: new Date(),
    },
  });

  await notify({
    kind: "SUBSCRIBER",
    title: `Newsletter subscriber — ${normalised}`,
    body: source ? `Signed up from ${source}.` : null,
    href: "/admin/newsletter",
    entityType: "subscriber",
    attributeToCurrentUser: false,
  });

  const settings = await getSiteSettings();
  const template = newsletterTemplate({
    companyName: settings.companyName,
    siteUrl: absoluteUrl("/"),
  });
  void sendEmail({ to: normalised, subject: template.subject, html: template.html });

  return NextResponse.json(
    { ok: true, message: "You're subscribed. Welcome aboard." },
    { headers: rateLimitHeaders(limit) },
  );
}
