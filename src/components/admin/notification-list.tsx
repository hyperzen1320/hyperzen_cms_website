"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  Rocket,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  clearNotificationsAction,
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/admin/notifications/actions";
import { cn, formatDateTime, relativeTime } from "@/lib/utils";
import type { NotificationKind, NotificationLevel } from "@prisma/client";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  level: NotificationLevel;
  title: string;
  body: string | null;
  href: string | null;
  actorName: string | null;
  readAt: string | null;
  createdAt: string;
};

const ICONS: Record<NotificationKind, typeof Mail> = {
  LEAD: Mail,
  APPLICATION: Users,
  SUBSCRIBER: UserPlus,
  PORTAL: UserPlus,
  CONTENT: FileText,
  PUBLISH: Rocket,
  MEDIA: ImageIcon,
  SETTINGS: Settings,
  ACCOUNT: Users,
};

const LEVEL_STYLES: Record<NotificationLevel, string> = {
  INFO: "border-[var(--a-border)] text-[var(--a-muted)]",
  SUCCESS: "border-success/35 bg-success/10 text-success",
  WARNING: "border-warning/35 bg-warning/10 text-warning",
};

export function NotificationList({
  items,
  unreadCount,
  canClear,
}: {
  items: NotificationItem[];
  unreadCount: number;
  canClear: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmClear, setConfirmClear] = useState(false);

  const run = (action: () => Promise<{ ok: boolean; message?: string }>, quiet = false) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (!quiet && result.message) toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });

  return (
    <>
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--a-border)] px-5 py-3">
          <p className="text-[13px] text-[var(--a-muted)]">
            {unreadCount ? `${unreadCount} unread` : "All caught up"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending || !unreadCount}
              onClick={() => run(() => markAllNotificationsReadAction())}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              Mark all read
            </button>
            {canClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-danger transition-colors hover:border-danger/40"
              >
                <Trash2 className="size-3.5" />
                Clear read
              </button>
            ) : null}
          </div>
        </div>

        <ul className="divide-y divide-[var(--a-border)]">
          {items.map((item) => {
            const Icon = ICONS[item.kind] ?? FileText;
            const unread = !item.readAt;

            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3.5 px-5 py-4 transition-colors",
                  unread && "bg-[color-mix(in_oklab,var(--accent)_5%,transparent)]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border",
                    LEVEL_STYLES[item.level],
                  )}
                >
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-[14px] text-[var(--a-fg-strong)]",
                        unread && "font-medium",
                      )}
                    >
                      {item.title}
                    </span>
                    {unread ? (
                      <span
                        className="inline-block size-1.5 rounded-full"
                        style={{ background: "var(--accent)" }}
                        aria-label="Unread"
                      />
                    ) : null}
                  </p>

                  {item.body ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--a-muted)]">
                      {item.body}
                    </p>
                  ) : null}

                  <p className="mt-1.5 text-[11.5px] text-[var(--a-subtle)]">
                    <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
                      {relativeTime(item.createdAt)}
                    </time>
                    {item.actorName ? ` · ${item.actorName}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (unread) run(() => markNotificationReadAction(item.id), true);
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--a-border)] px-2.5 text-[12.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
                    >
                      Open
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  ) : null}

                  {unread ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => markNotificationReadAction(item.id), true)}
                      aria-label="Mark as read"
                      className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] transition-colors hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)]"
                    >
                      <CheckCheck className="size-3.5" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => deleteNotificationAction(item.id), true)}
                    aria-label="Remove notification"
                    className="grid size-8 place-items-center rounded-lg text-[var(--a-subtle)] transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <ConfirmDialog
        open={confirmClear}
        title="Clear read notifications?"
        description="Unread notifications are kept. This only removes entries you have already seen."
        confirmLabel="Clear"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          run(() => clearNotificationsAction());
        }}
      />
    </>
  );
}
