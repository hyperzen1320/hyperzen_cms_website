import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getResource } from "@/lib/admin/resources";
import { EmptyState, PageHeader, Pagination } from "@/components/admin/ui";
import { ResourceTable } from "@/components/admin/resource-table";
import { AdminSearch, StatusFilter } from "@/components/admin/list-controls";
import { DeletedItems } from "@/components/admin/deleted-items";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resource } = await params;
  const config = getResource(resource);
  return { title: config?.label ?? "Content" };
}

export default async function ResourceListPage({ params, searchParams }: Props) {
  const [{ resource }, { q, status, page }] = await Promise.all([params, searchParams]);
  const config = getResource(resource);
  if (!config) notFound();

  const user = await requireUser();
  if (!can(user.role, config.capability)) notFound();

  const currentPage = Math.max(1, Number(page) || 1);
  const query = q?.trim() ?? "";

  const where = {
    ...(query
      ? {
          OR: config.searchFields.map((field) => ({
            [field]: { contains: query, mode: "insensitive" as const },
          })),
        }
      : {}),
    ...(status && config.hasStatus ? { status: status as any } : {}),
  };

  const delegate = (prisma as any)[config.model];

  const [rows, total, counts] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: config.hasOrder
        ? [{ order: "asc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    delegate.count({ where }),
    config.hasStatus
      ? delegate.groupBy({ by: ["status"], _count: { _all: true } })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusCounts = Object.fromEntries(
    (counts as { status: string; _count: { _all: number } }[]).map((item) => [
      item.status,
      item._count._all,
    ]),
  );

  const buildHref = (nextPage: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (status) search.set("status", status);
    if (nextPage > 1) search.set("page", String(nextPage));
    const suffix = search.toString();
    return `/admin/${config.key}${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title={config.label}
        description={config.description}
        action={
          can(user.role, "content.write")
            ? { label: `New ${config.singular.toLowerCase()}`, href: `/admin/${config.key}/new` }
            : null
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch placeholder={`Search ${config.label.toLowerCase()}`} />
        {config.hasStatus ? (
          <StatusFilter counts={statusCounts} total={total} />
        ) : (
          <p className="text-[13px] text-[var(--a-muted)]">
            {total} {total === 1 ? "entry" : "entries"}
          </p>
        )}
      </div>

      {rows.length ? (
        <>
          <ResourceTable
            config={config}
            rows={rows as (Record<string, unknown> & { id: string })[]}
            canDelete={can(user.role, "content.delete")}
            canPublish={can(user.role, "content.publish")}
          />
          <Pagination page={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </>
      ) : (
        <EmptyState
          title={query || status ? "No matches" : `No ${config.label.toLowerCase()} yet`}
          description={
            query || status
              ? "Try a different search term or clear the filters."
              : `Create your first ${config.singular.toLowerCase()} — it appears on the website as soon as you publish it.`
          }
          action={
            can(user.role, "content.write")
              ? { label: `New ${config.singular.toLowerCase()}`, href: `/admin/${config.key}/new` }
              : undefined
          }
        />
      )}

      {can(user.role, "content.write") ? (
        <DeletedItems resourceKey={config.key} label={config.label} />
      ) : null}
    </div>
  );
}
