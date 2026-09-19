"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { restoreRevisionAction } from "@/app/admin/actions";
import { formatDateTime, relativeTime } from "@/lib/utils";

type Revision = {
  id: string;
  label: string | null;
  createdAt: string;
  authorName: string | null;
};

export function RevisionHistory({
  revisions,
  canRestore,
}: {
  revisions: Revision[];
  canRestore: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Revision | null>(null);

  if (!revisions.length) return null;

  const restore = (revision: Revision) => {
    startTransition(async () => {
      const result = await restoreRevisionAction(revision.id);
      if (result.ok) {
        toast.success(result.message ?? "Restored.");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="mt-6 rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left"
      >
        <History className="size-4 text-[var(--a-muted)]" />
        <span className="text-[14px] font-medium text-[var(--a-fg-strong)]">Revision history</span>
        <span className="rounded-md border border-[var(--a-border)] px-1.5 py-0.5 text-[11px] text-[var(--a-muted)]">
          {revisions.length}
        </span>
        <span className="ml-auto text-[12.5px] text-[var(--a-muted)]">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open ? (
        <ul className="divide-y divide-[var(--a-border)] border-t border-[var(--a-border)]">
          {revisions.map((revision) => (
            <li key={revision.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-[var(--a-fg)]">
                  {revision.label ?? "Snapshot"}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--a-subtle)]">
                  {formatDateTime(revision.createdAt)} · {relativeTime(revision.createdAt)}
                  {revision.authorName ? ` · ${revision.authorName}` : ""}
                </p>
              </div>

              {canRestore ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setTarget(revision)}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="size-3.5" />
                  )}
                  Restore
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ConfirmDialog
        open={Boolean(target)}
        title="Restore this revision?"
        description="The current content is snapshotted first, so this can be undone."
        confirmLabel="Restore"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          const revision = target;
          setTarget(null);
          if (revision) restore(revision);
        }}
      />
    </div>
  );
}
