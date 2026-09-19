"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge, Table, Td, Th } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  deleteSubscriberAction,
  toggleSubscriberAction,
} from "@/app/admin/settings/actions";
import { formatDate } from "@/lib/utils";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  isSubscribed: boolean;
  source: string | null;
  createdAt: string;
};

export function SubscriberTable({
  subscribers,
  canWrite,
}: {
  subscribers: Subscriber[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<Subscriber | null>(null);

  const run = (action: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Updated.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Source</Th>
            <Th>Subscribed</Th>
            {canWrite ? <Th className="w-24 text-right">Actions</Th> : null}
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id} className="transition-colors hover:bg-[var(--a-hover)]">
              <Td>
                <a
                  href={`mailto:${subscriber.email}`}
                  className="text-[var(--a-fg-strong)] hover:underline"
                >
                  {subscriber.email}
                </a>
              </Td>
              <Td className="text-[var(--a-muted)]">{subscriber.name ?? "—"}</Td>
              <Td>
                {subscriber.isSubscribed ? (
                  <Badge tone="success">Subscribed</Badge>
                ) : (
                  <Badge>Unsubscribed</Badge>
                )}
              </Td>
              <Td className="text-[var(--a-muted)]">{subscriber.source ?? "—"}</Td>
              <Td className="text-[var(--a-muted)]">{formatDate(subscriber.createdAt)}</Td>
              {canWrite ? (
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => toggleSubscriberAction(subscriber.id, !subscriber.isSubscribed))
                      }
                      aria-label={subscriber.isSubscribed ? "Unsubscribe" : "Resubscribe"}
                      className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] transition-colors hover:bg-[var(--a-active)] hover:text-[var(--a-fg)]"
                    >
                      {subscriber.isSubscribed ? (
                        <UserMinus className="size-3.5" />
                      ) : (
                        <UserPlus className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(subscriber)}
                      aria-label="Delete subscriber"
                      className="grid size-8 place-items-center rounded-lg text-danger transition-colors hover:bg-danger/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </Td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </Table>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Remove ${pendingDelete?.email ?? ""}?`}
        description="This deletes the record entirely. To keep the history, unsubscribe them instead."
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target) run(() => deleteSubscriberAction(target.id));
        }}
      />
    </>
  );
}
