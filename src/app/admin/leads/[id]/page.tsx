import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { Card, CardTitle } from "@/components/admin/ui";
import { LeadWorkspace } from "@/components/admin/lead-workspace";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Lead" };

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const user = await requireUser();
  if (!can(user.role, "leads.read")) notFound();

  const { id } = await params;

  const [lead, admins] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
      },
    }),
    prisma.adminUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!lead) notFound();

  const meta: { label: string; value: string | null }[] = [
    { label: "Company", value: lead.company },
    { label: "Website", value: lead.website },
    { label: "Service", value: lead.service },
    { label: "Budget", value: lead.budget },
    { label: "Timeline", value: lead.timeline },
    { label: "Received", value: formatDateTime(lead.createdAt) },
    { label: "Source", value: lead.source },
    { label: "Landing page", value: lead.sourcePage },
    { label: "Referrer", value: lead.referrer },
    { label: "UTM source", value: lead.utmSource },
    { label: "UTM medium", value: lead.utmMedium },
    { label: "UTM campaign", value: lead.utmCampaign },
    { label: "UTM term", value: lead.utmTerm },
    { label: "UTM content", value: lead.utmContent },
  ];

  return (
    <div>
      <Link
        href="/admin/leads"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--a-muted)] transition-colors hover:text-[var(--a-fg)]"
      >
        <ArrowLeft className="size-3.5" />
        All leads
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[20px] font-semibold tracking-tight text-[var(--a-fg-strong)]">
                  {lead.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px]">
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline"
                  >
                    <Mail className="size-3.5" />
                    {lead.email}
                  </a>
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-[var(--a-muted)] hover:text-[var(--a-fg)]"
                    >
                      <Phone className="size-3.5" />
                      {lead.phone}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-[var(--a-border)] bg-[var(--a-panel-2)] p-4">
              <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--a-subtle)]">
                Project description
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[var(--a-fg)]">
                {lead.message}
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle title="Enquiry details" />
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {meta
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <dt className="w-28 shrink-0 text-[12.5px] text-[var(--a-subtle)]">
                      {item.label}
                    </dt>
                    <dd className="min-w-0 flex-1 break-words text-[13px] text-[var(--a-fg)]">
                      {item.value}
                    </dd>
                  </div>
                ))}
            </dl>
          </Card>
        </div>

        <LeadWorkspace
          lead={{
            id: lead.id,
            status: lead.status,
            assignedToId: lead.assignedToId,
            email: lead.email,
            name: lead.name,
          }}
          admins={admins}
          notes={lead.notes.map((note) => ({
            id: note.id,
            body: note.body,
            createdAt: note.createdAt.toISOString(),
            authorName: note.author?.name ?? "System",
          }))}
          canWrite={can(user.role, "leads.write")}
          canDelete={can(user.role, "leads.delete")}
        />
      </div>
    </div>
  );
}
