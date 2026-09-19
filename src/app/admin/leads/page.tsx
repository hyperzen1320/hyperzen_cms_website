import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  EmptyState,
  PageHeader,
  Pagination,
  StatCard,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { AdminSearch, FilterPills } from "@/components/admin/list-controls";
import { relativeTime, truncate } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Leads" };

const PAGE_SIZE = 25;

const STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST",
];

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function LeadsPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!can(user.role, "leads.read")) notFound();

  const { q, status, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const query = q?.trim() ?? "";

  const where = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { company: { contains: query, mode: "insensitive" as const } },
            { message: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as LeadStatus } : {}),
  };

  const [leads, total, counts, allTotal] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      include: { assignedTo: { select: { name: true } }, _count: { select: { notes: true } } },
    }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.count(),
  ]);

  const byStatus = Object.fromEntries(
    counts.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (nextPage > 1) params.set("page", String(nextPage));
    const suffix = params.toString();
    return `/admin/leads${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every enquiry from the website, with status, notes and owner."
      >
        <Link
          href="/api/admin/export/leads"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3.5 text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
        >
          <Download className="size-3.5" />
          Export CSV
        </Link>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard label="All" value={allTotal} href="/admin/leads" />
        {STATUSES.map((value) => (
          <StatCard
            key={value}
            label={value.charAt(0) + value.slice(1).toLowerCase()}
            value={byStatus[value] ?? 0}
            href={`/admin/leads?status=${value}`}
            accent={value === "NEW"}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminSearch placeholder="Search name, email, company or message" />
        <FilterPills
          param="status"
          options={STATUSES.map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
            count: byStatus[value] ?? 0,
          }))}
        />
      </div>

      {leads.length ? (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Contact</Th>
                <Th>Service</Th>
                <Th>Budget</Th>
                <Th>Source</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
                <Th>Received</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="transition-colors hover:bg-[var(--a-hover)]">
                  <Td>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-medium text-[var(--a-fg-strong)] hover:underline"
                    >
                      {lead.name}
                    </Link>
                    <span className="mt-0.5 block text-[12px] text-[var(--a-subtle)]">
                      {lead.company ? `${lead.company} · ` : ""}
                      {truncate(lead.email, 30)}
                    </span>
                  </Td>
                  <Td className="text-[var(--a-muted)]">{lead.service ?? "—"}</Td>
                  <Td className="text-[var(--a-muted)]">{lead.budget ?? "—"}</Td>
                  <Td className="text-[var(--a-muted)]">
                    {lead.utmSource ?? lead.source ?? "—"}
                  </Td>
                  <Td className="text-[var(--a-muted)]">{lead.assignedTo?.name ?? "Unassigned"}</Td>
                  <Td>
                    <StatusBadge status={lead.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-[var(--a-muted)]">
                    {relativeTime(lead.createdAt)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </>
      ) : (
        <EmptyState
          title={query || status ? "No leads match those filters" : "No enquiries yet"}
          description={
            query || status
              ? "Try clearing the search or choosing a different status."
              : "When someone submits the contact form, the enquiry lands here immediately — even if email delivery is not configured."
          }
        />
      )}

      {!leads.length && !query && !status ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-[12.5px] text-[var(--a-subtle)]">
          <Inbox className="size-3.5" />
          Tip: submit the form at /contact to see the full flow end to end.
        </p>
      ) : null}
    </div>
  );
}
