import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { NotificationKind, NotificationLevel, NotificationSettings } from "@prisma/client";

export { KIND_LABELS, RETENTION_OPTIONS } from "@/lib/notification-options";

/**
 * Activity notifications.
 *
 * Recording is always best-effort: a notification must never be the reason a
 * save, an enquiry or a sign-up fails. Every write is wrapped so a failure here
 * is logged and swallowed.
 */

/** Which switch in settings governs each kind. */
const KIND_GROUP: Record<NotificationKind, "leads" | "content" | "system"> = {
  LEAD: "leads",
  APPLICATION: "leads",
  SUBSCRIBER: "leads",
  PORTAL: "leads",
  CONTENT: "content",
  PUBLISH: "content",
  MEDIA: "content",
  SETTINGS: "system",
  ACCOUNT: "system",
};

export const getNotificationSettings = cache(async (): Promise<NotificationSettings> => {
  const existing = await prisma.notificationSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.notificationSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
});

export type NotifyInput = {
  kind: NotificationKind;
  title: string;
  body?: string | null;
  href?: string | null;
  level?: NotificationLevel;
  entityType?: string | null;
  entityId?: string | null;
  /** Pass false for events that no signed-in user triggered (public forms). */
  attributeToCurrentUser?: boolean;
};

/**
 * Record one notification. Safe to call from anywhere on the server — it never
 * throws and never blocks the caller's own work.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    const group = KIND_GROUP[input.kind];

    if (group === "leads" && !settings.notifyLeads) return;
    if (group === "content" && !settings.notifyContent) return;
    if (group === "system" && !settings.notifySystem) return;

    const actor =
      input.attributeToCurrentUser === false ? null : await getCurrentUser().catch(() => null);

    await prisma.notification.create({
      data: {
        kind: input.kind,
        level: input.level ?? "INFO",
        title: input.title.slice(0, 240),
        body: input.body?.slice(0, 1000) ?? null,
        href: input.href ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? null,
      },
    });
  } catch (error) {
    console.error("[notifications] could not record:", error);
  }
}

/**
 * Delete anything past the retention window. Called opportunistically when the
 * notification centre is opened, at most once an hour, so no scheduler is
 * required — and callable directly from the settings screen.
 */
export async function purgeExpiredNotifications(force = false): Promise<number> {
  try {
    const settings = await getNotificationSettings();
    if (settings.retentionDays <= 0) return 0;

    if (!force && settings.lastPurgedAt) {
      const sinceLastPurge = Date.now() - settings.lastPurgedAt.getTime();
      if (sinceLastPurge < 60 * 60 * 1000) return 0;
    }

    const cutoff = new Date(Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000);
    const { count } = await prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    await prisma.notificationSettings.update({
      where: { id: "singleton" },
      data: { lastPurgedAt: new Date() },
    });

    return count;
  } catch (error) {
    console.error("[notifications] purge failed:", error);
    return 0;
  }
}

export async function getUnreadCount(): Promise<number> {
  return prisma.notification.count({ where: { readAt: null } }).catch(() => 0);
}

export async function getRecentNotifications(limit = 8) {
  return prisma.notification
    .findMany({ orderBy: { createdAt: "desc" }, take: limit })
    .catch(() => []);
}

/** A short, human description of what changed between two content records. */
export function describeChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  fields: string[],
): string | null {
  if (!before) return null;

  const changed: string[] = [];
  for (const field of fields) {
    if (field === "updatedAt" || field === "createdAt") continue;
    const previous = JSON.stringify(before[field] ?? null);
    const next = JSON.stringify(after[field] ?? null);
    if (previous !== next) changed.push(field);
  }

  if (!changed.length) return null;

  const readable = changed.slice(0, 4).map(humaniseField);
  const extra = changed.length - readable.length;
  return `Changed ${readable.join(", ")}${extra > 0 ? ` and ${extra} more` : ""}.`;
}

function humaniseField(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toLowerCase())
    .replace(/\bdesc\b/, "description")
    .replace(/\bseo /, "SEO ")
    .trim();
}
