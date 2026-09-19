import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  getNotificationSettings,
  purgeExpiredNotifications,
  RETENTION_OPTIONS,
} from "@/lib/notifications";
import { EmptyState, PageHeader, Pagination, StatCard } from "@/components/admin/ui";
import { FilterPills } from "@/components/admin/list-controls";
import { NotificationList } from "@/components/admin/notification-list";
import { NotificationSettingsPanel } from "@/components/admin/notification-settings-panel";
import type { NotificationKind } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notifications" };

const PAGE_SIZE = 30;

const KINDS: NotificationKind[] = [
  "LEAD",
  "APPLICATION",
  "SUBSCRIBER",
  "PORTAL",
  "CONTENT",
  "PUBLISH",
  "MEDIA",
  "SETTINGS",
  "ACCOUNT",
];

type Props = {
  searchParams: Promise<{ kind?: string; unread?: string; page?: string }>;
};

export default async function NotificationsPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!can(user.role, "notifications.read")) notFound();

  const { kind, unread, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  // Opportunistic housekeeping — no scheduler needed.
  await purgeExpiredNotifications();

  const where = {
    ...(kind && KINDS.includes(kind as NotificationKind)
      ? { kind: kind as NotificationKind }
      : {}),
    ...(unread === "1" ? { readAt: null } : {}),
  };

  const [items, total, unreadCount, counts, settings] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { readAt: null } }),
    prisma.notification.groupBy({ by: ["kind"], _count: { _all: true } }),
    getNotificationSettings(),
  ]);

  const byKind = Object.fromEntries(
    counts.map((row) => [row.kind, row._count._all]),
  ) as Record<string, number>;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const retentionLabel =
    RETENTION_OPTIONS.find((option) => option.value === settings.retentionDays)?.label ??
    `${settings.retentionDays} days`;

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (unread === "1") params.set("unread", "1");
    if (nextPage > 1) params.set("page", String(nextPage));
    const suffix = params.toString();
    return `/admin/notifications${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Every change, enquiry and sign-up as it happens. Nothing here is sampled — small edits are recorded too."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Unread" value={unreadCount} accent href="/admin/notifications?unread=1" />
        <StatCard label="Recorded" value={total} />
        <StatCard label="Kept for" value={retentionLabel} hint="Older entries are removed automatically" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterPills
          param="kind"
          allLabel="Everything"
          options={KINDS.filter((value) => byKind[value]).map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
            count: byKind[value],
          }))}
        />
        <FilterPills
          param="unread"
          allLabel="Read & unread"
          options={[{ value: "1", label: "Unread only", count: unreadCount }]}
        />
      </div>

      {items.length ? (
        <>
          <NotificationList
            items={items.map((item) => ({
              id: item.id,
              kind: item.kind,
              level: item.level,
              title: item.title,
              body: item.body,
              href: item.href,
              actorName: item.actorName,
              readAt: item.readAt?.toISOString() ?? null,
              createdAt: item.createdAt.toISOString(),
            }))}
            unreadCount={unreadCount}
            canClear={can(user.role, "settings.write")}
          />
          <Pagination page={currentPage} totalPages={totalPages} buildHref={buildHref} />
        </>
      ) : (
        <EmptyState
          title={kind || unread ? "Nothing matches those filters" : "No activity yet"}
          description={
            kind || unread
              ? "Try clearing the filters."
              : "Every content change, enquiry, application and sign-up will appear here as it happens."
          }
        />
      )}

      {can(user.role, "settings.write") ? (
        <div className="mt-6">
          <NotificationSettingsPanel
            values={{
              retentionDays: settings.retentionDays,
              notifyLeads: settings.notifyLeads,
              notifyContent: settings.notifyContent,
              notifySystem: settings.notifySystem,
            }}
            lastPurgedAt={settings.lastPurgedAt?.toISOString() ?? null}
          />
        </div>
      ) : null}
    </div>
  );
}
