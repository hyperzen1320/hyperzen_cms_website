"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  addLeadNoteAction,
  assignLeadAction,
  deleteLeadAction,
  updateLeadStatusAction,
} from "@/app/admin/leads/actions";
import { cn, relativeTime } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";

const PIPELINE: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

type Note = { id: string; body: string; createdAt: string; authorName: string };

export function LeadWorkspace({
  lead,
  admins,
  notes,
  canWrite,
  canDelete,
}: {
  lead: {
    id: string;
    status: LeadStatus;
    assignedToId: string | null;
    email: string;
    name: string;
  };
  admins: { id: string; name: string }[];
  notes: Note[];
  canWrite: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [assignee, setAssignee] = useState(lead.assignedToId ?? "");
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    <div className="space-y-4">
      <Card>
        <CardTitle title="Pipeline" description="Where this enquiry sits today." />
        <div className="grid grid-cols-2 gap-2">
          {PIPELINE.map((value) => (
            <button
              key={value}
              type="button"
              disabled={!canWrite || pending}
              onClick={() => {
                setStatus(value);
                run(() => updateLeadStatusAction(lead.id, value));
              }}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors disabled:opacity-60",
                status === value
                  ? "border-[color-mix(in_oklab,var(--accent)_55%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--a-fg-strong)]"
                  : "border-[var(--a-border)] text-[var(--a-muted)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]",
              )}
            >
              {value.charAt(0) + value.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle title="Owner" description="Who is following this up." />
        <select
          value={assignee}
          disabled={!canWrite || pending}
          onChange={(event) => {
            setAssignee(event.target.value);
            run(() => assignLeadAction(lead.id, event.target.value || null));
          }}
          className="a-input"
        >
          <option value="">Unassigned</option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.name}
            </option>
          ))}
        </select>

        <a
          href={`mailto:${lead.email}?subject=${encodeURIComponent("Re: your enquiry")}`}
          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--a-border)] text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
        >
          Reply by email
        </a>
      </Card>

      <Card>
        <CardTitle title="Internal notes" description="Only visible to the team." />

        {canWrite ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!note.trim()) return;
              const body = note;
              setNote("");
              run(() => addLeadNoteAction(lead.id, body));
            }}
            className="mb-4"
          >
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="What happened on the call?"
              className="a-input h-auto resize-y py-2.5 leading-relaxed"
            />
            <button
              type="submit"
              disabled={pending || !note.trim()}
              className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Add note
            </button>
          </form>
        ) : null}

        {notes.length ? (
          <ul className="space-y-3">
            {notes.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-[var(--a-border)] bg-[var(--a-panel-2)] p-3.5"
              >
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--a-fg)]">
                  {item.body}
                </p>
                <p className="mt-2 text-[11.5px] text-[var(--a-subtle)]">
                  {item.authorName} · {relativeTime(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-[var(--a-muted)]">No notes yet.</p>
        )}
      </Card>

      {canDelete ? (
        <Card className="border-danger/25 bg-danger/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13.5px] font-medium text-[var(--a-fg-strong)]">Delete lead</h2>
              <p className="mt-1 text-[12px] text-[var(--a-muted)]">
                Permanently removes the enquiry and its notes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-danger/40 px-3 text-[13px] text-danger transition-colors hover:bg-danger/10"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete the enquiry from ${lead.name}?`}
        description="This cannot be undone. Consider marking it as lost instead so the history is kept."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          startTransition(async () => {
            const result = await deleteLeadAction(lead.id);
            if (result.ok) {
              toast.success(result.message ?? "Deleted.");
              router.push("/admin/leads");
              router.refresh();
            } else {
              toast.error(result.message);
            }
          });
        }}
      />
    </div>
  );
}
