"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/admin/ui";
import { saveNotificationSettingsAction } from "@/app/admin/notifications/actions";
import { RETENTION_OPTIONS } from "@/lib/notification-options";
import { cn, formatDateTime } from "@/lib/utils";

type Values = {
  retentionDays: number;
  notifyLeads: boolean;
  notifyContent: boolean;
  notifySystem: boolean;
};

const GROUPS: { key: keyof Values; label: string; description: string }[] = [
  {
    key: "notifyLeads",
    label: "Enquiries and sign-ups",
    description: "Contact form, job applications, newsletter, new portal accounts.",
  },
  {
    key: "notifyContent",
    label: "Content changes",
    description: "Every create, edit, delete, publish and media upload — including small edits.",
  },
  {
    key: "notifySystem",
    label: "Settings and accounts",
    description: "Branding, SEO, email, navigation and admin user changes.",
  },
];

/** Global-admin controls: what gets recorded, and how long it is kept. */
export function NotificationSettingsPanel({
  values: initial,
  lastPurgedAt,
}: {
  values: Values;
  lastPurgedAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Values>(initial);
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setDirty(true);
    setValues((current) => ({ ...current, [key]: value }));
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveNotificationSettingsAction(values);
      if (result.ok) {
        toast.success(result.message ?? "Saved.");
        setDirty(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });

  return (
    <Card>
      <CardTitle
        title="Notification settings"
        description="Global admin only. Controls what is recorded and how long the activity log is kept."
      />

      <fieldset>
        <legend className="a-label">Keep notifications for</legend>
        <div className="flex flex-wrap gap-2">
          {RETENTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set("retentionDays", option.value)}
              aria-pressed={values.retentionDays === option.value}
              className={cn(
                "rounded-lg border px-3.5 py-2 text-[13px] transition-colors",
                values.retentionDays === option.value
                  ? "border-[color-mix(in_oklab,var(--accent)_55%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--a-fg-strong)]"
                  : "border-[var(--a-border)] text-[var(--a-muted)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[var(--a-subtle)]">
          Anything older is deleted automatically.
          {lastPurgedAt ? ` Last cleaned ${formatDateTime(lastPurgedAt)}.` : ""}
        </p>
      </fieldset>

      <div className="mt-6 space-y-2.5">
        <p className="a-label">Record activity for</p>
        {GROUPS.map((group) => (
          <label
            key={group.key}
            className="flex items-start gap-3 rounded-lg border border-[var(--a-border)] p-3.5"
          >
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(values[group.key])}
              onClick={() => set(group.key, !values[group.key] as never)}
              className={cn(
                "mt-0.5 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
                values[group.key]
                  ? "border-transparent"
                  : "border-[var(--a-border)] bg-[var(--a-input)]",
              )}
              style={
                values[group.key]
                  ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                  : undefined
              }
            >
              <span
                className={cn(
                  "inline-block size-4 rounded-full bg-white transition-transform",
                  values[group.key] ? "translate-x-[22px]" : "translate-x-[3px]",
                )}
              />
            </button>
            <span>
              <span className="block text-[13.5px] font-medium text-[var(--a-fg-strong)]">
                {group.label}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--a-muted)]">
                {group.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {dirty ? (
          <span className="mr-auto text-[12.5px] text-warning">Unsaved changes</span>
        ) : null}
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save settings
        </button>
      </div>
    </Card>
  );
}
