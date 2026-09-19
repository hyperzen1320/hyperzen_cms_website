"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { notify, purgeExpiredNotifications } from "@/lib/notifications";
import type { ActionResult } from "@/types";

async function guard() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: "Your session has expired." };
  if (!can(user.role, "notifications.read")) {
    return { user: null, error: "You do not have permission." };
  }
  return { user, error: null };
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  await prisma.notification.updateMany({
    where: { id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  const { count } = await prisma.notification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
  return { ok: true, message: count ? `${count} marked as read.` : "Nothing unread." };
}

export async function deleteNotificationAction(id: string): Promise<ActionResult> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  await prisma.notification.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/notifications");
  return { ok: true, message: "Removed." };
}

export async function clearNotificationsAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "settings.write")) {
    return { ok: false, message: "Only the global admin can clear the activity log." };
  }

  const { count } = await prisma.notification.deleteMany({ where: { readAt: { not: null } } });
  revalidatePath("/admin/notifications");
  return { ok: true, message: `Cleared ${count} read notification${count === 1 ? "" : "s"}.` };
}

/**
 * Retention and which activity is recorded. Global admin only — this decides
 * how long the record of every change is kept.
 */
export async function saveNotificationSettingsAction(payload: {
  retentionDays: number;
  notifyLeads: boolean;
  notifyContent: boolean;
  notifySystem: boolean;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "settings.write")) {
    return { ok: false, message: "Only the global admin can change notification settings." };
  }

  const retentionDays = Number(payload.retentionDays);
  if (!Number.isFinite(retentionDays) || retentionDays < 0 || retentionDays > 3650) {
    return { ok: false, message: "Choose a valid retention period." };
  }

  const data = {
    retentionDays: Math.trunc(retentionDays),
    notifyLeads: Boolean(payload.notifyLeads),
    notifyContent: Boolean(payload.notifyContent),
    notifySystem: Boolean(payload.notifySystem),
  };

  await prisma.notificationSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  // Apply the new window straight away rather than waiting for the next visit.
  const removed = await purgeExpiredNotifications(true);

  await notify({
    kind: "SETTINGS",
    title: "Notification settings updated",
    body:
      data.retentionDays === 0
        ? "Notifications are now kept indefinitely."
        : `Notifications are now kept for ${data.retentionDays} days.`,
    href: "/admin/notifications",
  });

  revalidatePath("/admin/notifications");
  return {
    ok: true,
    message: removed
      ? `Saved. ${removed} notification${removed === 1 ? "" : "s"} past the new window were removed.`
      : "Saved.",
  };
}
