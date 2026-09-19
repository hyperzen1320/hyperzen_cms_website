"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { listDeletedAction, restoreRevisionAction } from "@/app/admin/actions";
import { formatDateTime, relativeTime } from "@/lib/utils";

type Deleted = { id: string; label: string; deletedAt: string };

/**
 * Recently deleted entries, restorable from their last snapshot. Loaded on
 * demand so the list screen stays fast when nothing has been deleted.
 */
export function DeletedItems({ resourceKey, label }: { resourceKey: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Deleted[] | null>(null);

  const load = () => {
    setOpen(true);
    if (items) return;
    startTransition(async () => {
      const result = await listDeletedAction(resourceKey);
      setItems(result.ok ? (result.data ?? []) : []);
      if (!result.ok) toast.error(result.message);
    });
  };

  const restore = (revisionId: string) =>
    startTransition(async () => {
      const result = await restoreRevisionAction(revisionId);
      if (result.ok) {
        toast.success(result.message ?? "Restored.");
        setItems((current) => current?.filter((item) => item.id !== revisionId) ?? null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={load}
        className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--a-subtle)] transition-colors hover:text-[var(--a-fg)]"
      >
        <History className="size-3.5" />
        Recently deleted {label.toLowerCase()}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="size-4 text-[var(--a-muted)]" />
        <h2 className="text-[13.5px] font-medium text-[var(--a-fg-strong)]">Recently deleted</h2>
        {pending ? <Loader2 className="size-3.5 animate-spin text-[var(--a-subtle)]" /> : null}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto text-[12.5px] text-[var(--a-muted)] hover:text-[var(--a-fg)]"
        >
          Hide
        </button>
      </div>

      {items && items.length ? (
        <ul className="divide-y divide-[var(--a-border)]">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-[var(--a-fg)]">{item.label}</p>
                <p className="text-[11.5px] text-[var(--a-subtle)]">
                  Deleted {relativeTime(item.deletedAt)} · {formatDateTime(item.deletedAt)}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => restore(item.id)}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] disabled:opacity-60"
              >
                <RotateCcw className="size-3.5" />
                Restore
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-[var(--a-muted)]">
          {pending ? "Checking…" : "Nothing has been deleted recently."}
        </p>
      )}
    </div>
  );
}
