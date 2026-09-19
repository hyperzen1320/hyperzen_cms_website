import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { EmptyState, PageHeader, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesListPage() {
  const user = await requireUser();
  if (!can(user.role, "content.write")) notFound();

  const pages = await prisma.page.findMany({
    orderBy: [{ isSystem: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { sections: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Every page composed from blocks. System pages power fixed routes such as /about and the legal pages."
        action={{ label: "New page", href: "/admin/pages/new" }}
      />

      {pages.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Page</Th>
              <Th>URL</Th>
              <Th>Sections</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="transition-colors hover:bg-[var(--a-hover)]">
                <Td>
                  <Link
                    href={page.slug === "home" ? "/admin/homepage" : `/admin/pages/${page.id}`}
                    className="font-medium text-[var(--a-fg-strong)] hover:underline"
                  >
                    {page.title}
                  </Link>
                  {page.isSystem ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded border border-[var(--a-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--a-subtle)]">
                      <Lock className="size-2.5" />
                      system
                    </span>
                  ) : null}
                </Td>
                <Td className="font-mono text-[12.5px] text-[var(--a-muted)]">
                  /{page.slug === "home" ? "" : page.slug}
                </Td>
                <Td className="text-[var(--a-muted)]">{page._count.sections}</Td>
                <Td>
                  <StatusBadge status={page.status} />
                </Td>
                <Td className="text-[var(--a-muted)]">{formatDate(page.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState
          title="No pages yet"
          description="Create a page and compose it from blocks."
          action={{ label: "New page", href: "/admin/pages/new" }}
        />
      )}
    </div>
  );
}
