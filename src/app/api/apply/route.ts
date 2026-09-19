import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { assertSameOrigin, clientIpFrom } from "@/lib/auth";
import { jobApplicationSchema, fieldErrors } from "@/lib/validation";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getEmailConfig, jobApplicationTemplate, sendEmail } from "@/lib/email";
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
  const limit = rateLimit(`apply:${ip}`, 5, 15 * 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, message: "Too many applications submitted. Please try again later." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = jobApplicationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const data = parsed.data;
  if (data.company_website) return NextResponse.json({ ok: true, message: "Application received." });

  const job = data.jobId
    ? await prisma.job.findUnique({ where: { id: data.jobId }, select: { id: true, title: true, applyEmail: true } })
    : null;

  const application = await prisma.jobApplication.create({
    data: {
      jobId: job?.id ?? null,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      linkedin: data.linkedin || null,
      portfolio: data.portfolio || null,
      resumeUrl: data.resumeUrl || null,
      message: data.message || null,
      source: "careers",
    },
  });

  await notify({
    kind: "APPLICATION",
    title: `Application — ${job?.title ?? "General"} — ${data.name}`,
    body: data.message?.slice(0, 160) ?? null,
    href: "/admin/applications",
    entityType: "application",
    entityId: application.id,
    attributeToCurrentUser: false,
  });

  const [settings, emailConfig] = await Promise.all([getSiteSettings(), getEmailConfig()]);
  const notifyEmail = job?.applyEmail || emailConfig.notificationEmail || settings.email;

  if (notifyEmail) {
    const template = jobApplicationTemplate({
      name: data.name,
      email: data.email,
      jobTitle: job?.title ?? "General application",
      phone: data.phone,
      linkedin: data.linkedin,
      portfolio: data.portfolio,
      resumeUrl: data.resumeUrl,
      message: data.message,
      adminUrl: absoluteUrl(`/admin/careers/applications`),
    });
    void sendEmail({
      to: notifyEmail,
      subject: template.subject,
      html: template.html,
      replyTo: data.email,
    });
  }

  return NextResponse.json(
    { ok: true, message: "Application received. We will be in touch.", id: application.id },
    { headers: rateLimitHeaders(limit) },
  );
}
