import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { assertSameOrigin, clientIpFrom } from "@/lib/auth";
import { leadSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getEmailConfig, leadConfirmationTemplate, newLeadTemplate, sendEmail } from "@/lib/email";
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
  const limit = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, message: "Too many submissions. Please try again shortly." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Honeypot — silently accept so bots do not learn they were caught.
  if (data.company_website) {
    return NextResponse.json({ ok: true, message: "Thank you." });
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      company: data.company || null,
      website: data.website || null,
      service: data.service || null,
      budget: data.budget || null,
      timeline: data.timeline || null,
      message: data.message,
      source: data.utmSource ? "campaign" : data.referrer ? "referral" : "website",
      sourcePage: data.sourcePage || null,
      referrer: data.referrer || null,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
      utmTerm: data.utmTerm || null,
      utmContent: data.utmContent || null,
      ip,
      userAgent: headerList.get("user-agent")?.slice(0, 400) ?? null,
    },
  });

  await prisma.analyticsEvent
    .create({
      data: {
        type: "lead",
        path: data.sourcePage || "/contact",
        label: data.service || "unspecified",
        value: data.budget || null,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
      },
    })
    .catch(() => undefined);

  await notify({
    kind: "LEAD",
    level: "SUCCESS",
    title: `New enquiry — ${data.name}${data.company ? ` (${data.company})` : ""}`,
    body: [data.service, data.budget, data.timeline].filter(Boolean).join(" · ") || data.message.slice(0, 160),
    href: `/admin/leads/${lead.id}`,
    entityType: "lead",
    entityId: lead.id,
    attributeToCurrentUser: false,
  });

  // Email is best-effort: the lead is already safely stored in the CRM.
  const [settings, emailConfig] = await Promise.all([getSiteSettings(), getEmailConfig()]);
  const notifyEmail = emailConfig.notificationEmail || settings.email;

  if (notifyEmail) {
    const template = newLeadTemplate({
      ...data,
      adminUrl: absoluteUrl(`/admin/leads/${lead.id}`),
    });
    void sendEmail({
      to: notifyEmail,
      subject: template.subject,
      html: template.html,
      replyTo: data.email,
    });
  }

  const confirmation = leadConfirmationTemplate({
    name: data.name,
    email: data.email,
    companyName: settings.companyName,
  });
  void sendEmail({ to: data.email, subject: confirmation.subject, html: confirmation.html });

  return NextResponse.json(
    { ok: true, message: "Your idea is now in motion.", id: lead.id },
    { headers: rateLimitHeaders(limit) },
  );
}
