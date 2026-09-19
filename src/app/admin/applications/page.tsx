import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { AdminSearch, FilterPills } from "@/components/admin/list-controls";
import { ApplicationTable } from "@/components/admin/application-table";
import type { ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Applications" };

const STATUSES: ApplicationStatus[] = ["NEW", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"];

type Props = { searchParams: Promise<{ q?: string; status?: string }> };

export default async function ApplicationsPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!can(user.role, "leads.read")) notFound();

  const { q, status } = await searchParams;
  const query = q?.trim() ?? "";

  const [applications, counts, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { email: { contains: query, mode: "insensitive" as const } },
                { message: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
        ...(status ? { status: status as ApplicationStatus } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { job: { select: { title: true, slug: true } } },
    }),
    prisma.jobApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.jobApplication.count(),
  ]);

  const byStatus = Object.fromEntries(
    counts.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  return (
    <div>
      <PageHeader
        title="Job applications"
        description="Applications submitted through the careers pages."
      >
        <Link
          href="/api/admin/export/applications"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3.5 text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
        >
          <Download className="size-3.5" />
          Export CSV
        </Link>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="All" value={total} href="/admin/applications" />
        {STATUSES.map((value) => (
          <StatCard
            key={value}
            label={value.charAt(0) + value.slice(1).toLowerCase()}
            value={byStatus[value] ?? 0}
            href={`/admin/applications?status=${value}`}
            accent={value === "NEW"}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AdminSearch placeholder="Search applicants" />
        <FilterPills
          param="status"
          options={STATUSES.map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
            count: byStatus[value] ?? 0,
          }))}
        />
      </div>

      {applications.length ? (
        <ApplicationTable
          applications={applications.map((application) => ({
            id: application.id,
            name: application.name,
            email: application.email,
            phone: application.phone,
            linkedin: application.linkedin,
            portfolio: application.portfolio,
            message: application.message,
            status: application.status,
            jobTitle: application.job?.title ?? "General application",
            createdAt: application.createdAt.toISOString(),
          }))}
          canWrite={can(user.role, "leads.write")}
        />
      ) : (
        <EmptyState
          title={query || status ? "No matching applications" : "No applications yet"}
          description={
            query || status
              ? "Try clearing the filters."
              : "Publish a role under Careers and applications will appear here."
          }
        />
      )}
    </div>
  );
}
