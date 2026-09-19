import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { AdminSearch } from "@/components/admin/list-controls";
import { SubscriberTable } from "@/components/admin/subscriber-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Newsletter" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function NewsletterPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!can(user.role, "marketing.read")) notFound();

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [subscribers, total, active] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isSubscribed: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Newsletter"
        description="People who subscribed through the footer form."
      >
        <Link
          href="/api/admin/export/subscribers"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3.5 text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
        >
          <Download className="size-3.5" />
          Export CSV
        </Link>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={total} />
        <StatCard label="Subscribed" value={active} accent />
        <StatCard label="Unsubscribed" value={total - active} />
      </div>

      <div className="mb-4">
        <AdminSearch placeholder="Search by email or name" />
      </div>

      {subscribers.length ? (
        <SubscriberTable
          subscribers={subscribers.map((subscriber) => ({
            id: subscriber.id,
            email: subscriber.email,
            name: subscriber.name,
            isSubscribed: subscriber.isSubscribed,
            source: subscriber.source,
            createdAt: subscriber.createdAt.toISOString(),
          }))}
          canWrite={can(user.role, "marketing.write")}
        />
      ) : (
        <EmptyState
          title={query ? "No matching subscribers" : "No subscribers yet"}
          description={
            query
              ? "Try a different search term."
              : "Subscriptions from the footer form appear here immediately."
          }
        />
      )}
    </div>
  );
}
