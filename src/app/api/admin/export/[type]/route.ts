import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

/** CSV export for leads, newsletter subscribers and job applications. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });

  const { type } = await params;
  let rows: Record<string, unknown>[] = [];

  if (type === "leads") {
    if (!can(user.role, "leads.read")) return new NextResponse("Forbidden", { status: 403 });
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: { assignedTo: { select: { name: true } } },
    });
    rows = leads.map((lead) => ({
      created: lead.createdAt.toISOString(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      website: lead.website ?? "",
      service: lead.service ?? "",
      budget: lead.budget ?? "",
      timeline: lead.timeline ?? "",
      status: lead.status,
      owner: lead.assignedTo?.name ?? "",
      source: lead.source ?? "",
      sourcePage: lead.sourcePage ?? "",
      utmSource: lead.utmSource ?? "",
      utmMedium: lead.utmMedium ?? "",
      utmCampaign: lead.utmCampaign ?? "",
      message: lead.message,
    }));
  } else if (type === "subscribers") {
    if (!can(user.role, "marketing.read")) return new NextResponse("Forbidden", { status: 403 });
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    rows = subscribers.map((subscriber) => ({
      created: subscriber.createdAt.toISOString(),
      email: subscriber.email,
      name: subscriber.name ?? "",
      subscribed: subscriber.isSubscribed ? "yes" : "no",
      source: subscriber.source ?? "",
    }));
  } else if (type === "applications") {
    if (!can(user.role, "leads.read")) return new NextResponse("Forbidden", { status: 403 });
    const applications = await prisma.jobApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: { job: { select: { title: true } } },
    });
    rows = applications.map((application) => ({
      created: application.createdAt.toISOString(),
      role: application.job?.title ?? "General",
      name: application.name,
      email: application.email,
      phone: application.phone ?? "",
      linkedin: application.linkedin ?? "",
      portfolio: application.portfolio ?? "",
      status: application.status,
      message: application.message ?? "",
    }));
  } else {
    return new NextResponse("Unknown export", { status: 404 });
  }

  const csv = toCsv(rows);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hyperzen-${type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
