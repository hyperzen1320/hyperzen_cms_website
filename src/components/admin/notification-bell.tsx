"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/admin/notifications/actions";
import { cn, relativeTime } from "@/lib/utils";

export type BellItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * Unread activity in the topbar. The list is rendered on the server with the
 * page, so opening it costs nothing; it refreshes after any action.
 */
export function NotificationBell({
  items,
  unreadCount,
}: {
  items: BellItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = (action: () => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      await action();
      router.refresh();
    });

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative grid size-9 place-items-center rounded-lg border border-[var(--a-border)] text-[var(--a-muted)] transition-colors hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]"
      >
        <Bell className="size-4" />
        {unreadCount ? (
          <span
            className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-[22rem] overflow-hidden rounded-xl border border-[var(--a-border)] bg-[var(--a-elevated)] shadow-[var(--a-shadow)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--a-border)] px-4 py-2.5">
              <p className="text-[13px] font-medium text-[var(--a-fg-strong)]">Activity</p>
              {unreadCount ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => markAllNotificationsReadAction())}
                  className="inline-flex items-center gap-1 text-[12px] text-[var(--a-muted)] transition-colors hover:text-[var(--a-fg)] disabled:opacity-50"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              ) : null}
            </div>

            {items.length ? (
              <ul className="max-h-[22rem] divide-y divide-[var(--a-border)] overflow-y-auto">
                {items.map((item) => {
                  const unread = !item.readAt;
                  const body = (
                    <>
                      <span
                        className={cn(
                          "block text-[13px] text-[var(--a-fg-strong)]",
                          unread && "font-medium",
                        )}
                      >
                        {item.title}
                      </span>
                      {item.body ? (
                        <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-[var(--a-muted)]">
                          {item.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[11px] text-[var(--a-subtle)]">
                        {relativeTime(item.createdAt)}
                      </span>
                    </>
                  );

                  const className = cn(
                    "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--a-hover)]",
                    unread && "bg-[color-mix(in_oklab,var(--accent)_6%,transparent)]",
                  );

                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={className}
                          onClick={() => {
                            setOpen(false);
                            if (unread) run(() => markNotificationReadAction(item.id));
                          }}
                        >
                          <Dot unread={unread} />
                          <span className="min-w-0 flex-1">{body}</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={className}
                          onClick={() => unread && run(() => markNotificationReadAction(item.id))}
                        >
                          <Dot unread={unread} />
                          <span className="min-w-0 flex-1">{body}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-[13px] text-[var(--a-muted)]">
                Nothing yet. Changes and enquiries will show up here.
              </p>
            )}

            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-[var(--a-border)] px-4 py-2.5 text-center text-[12.5px] text-[var(--a-muted)] transition-colors hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)]"
            >
              View all activity
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Dot({ unread }: { unread: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", !unread && "opacity-0")}
      style={unread ? { background: "var(--accent)" } : undefined}
    />
  );
}
