"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Info, Loader2, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { saveEmailSettingsAction, testSmtpAction } from "@/app/admin/settings/actions";
import type { Field } from "@/lib/admin/fields";

const FIELDS: Field[] = [
  {
    name: "enabled",
    label: "Send email",
    type: "switch",
    group: "Connection",
    help: "When this is off, submissions are still stored in the CMS — no email is sent.",
  },
  { name: "smtpHost", label: "SMTP host", type: "text", group: "Connection", width: "half", placeholder: "smtp.gmail.com" },
  { name: "smtpPort", label: "Port", type: "number", group: "Connection", width: "half", placeholder: "587" },
  { name: "smtpUser", label: "Username", type: "text", group: "Connection", width: "half" },
  { name: "smtpPassword", label: "Password", type: "text", group: "Connection", width: "half", help: "Leave blank to keep the stored password." },
  {
    name: "smtpSecure",
    label: "Use TLS on connect (port 465)",
    type: "switch",
    group: "Connection",
    help: "Leave off for port 587, which upgrades with STARTTLS.",
  },

  { name: "fromName", label: "From name", type: "text", group: "Addresses", width: "half" },
  { name: "fromEmail", label: "From address", type: "text", group: "Addresses", width: "half" },
  {
    name: "notificationEmail",
    label: "Notification inbox",
    type: "text",
    group: "Addresses",
    width: "half",
    help: "Where new enquiries and applications are delivered.",
  },
  { name: "replyTo", label: "Reply-to", type: "text", group: "Addresses", width: "half" },
];

export function EmailSettingsPanel({
  values,
  source,
  hasStoredPassword,
}: {
  values: Record<string, unknown>;
  source: "database" | "environment" | "none";
  hasStoredPassword: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const test = () =>
    startTransition(async () => {
      const outcome = await testSmtpAction();
      setResult({ ok: outcome.ok, message: outcome.message ?? "" });
      if (outcome.ok) toast.success(outcome.message);
      else toast.error(outcome.message);
    });

  return (
    <SettingsForm fields={FIELDS} action={saveEmailSettingsAction} values={values}>
      <Card className="mb-4">
        <CardTitle title="Connection status" />

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--a-border)] px-3 py-2 text-[13px] text-[var(--a-fg)]">
            <Info className="size-3.5 text-[var(--a-muted)]" />
            {source === "database"
              ? "Using the credentials saved here"
              : source === "environment"
                ? "Using SMTP_* environment variables"
                : "No SMTP configured — email sending is skipped"}
          </span>

          {hasStoredPassword ? (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--a-muted)]">
              <CheckCircle2 className="size-3.5 text-success" />
              A password is stored
            </span>
          ) : null}

          <button
            type="button"
            onClick={test}
            disabled={pending}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3.5 text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
            Test connection
          </button>
        </div>

        {result ? (
          <p
            className={`mt-3 rounded-lg border px-3.5 py-2.5 text-[13px] ${
              result.ok
                ? "border-success/35 bg-success/10 text-success"
                : "border-danger/35 bg-danger/10 text-danger"
            }`}
          >
            {result.message}
          </p>
        ) : null}

        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--a-muted)]">
          Save your changes before testing — the test uses the stored configuration. The website
          works fine without SMTP: every enquiry is written to the database and appears under Leads
          regardless.
        </p>
      </Card>
    </SettingsForm>
  );
}
