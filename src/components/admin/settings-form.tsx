"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { FieldInput } from "@/components/admin/field-input";
import { Card, CardTitle } from "@/components/admin/ui";
import type { Field } from "@/lib/admin/fields";
import type { ActionResult } from "@/types";

/**
 * Shared settings form. Every settings screen supplies its field list and the
 * server action that persists it, so validation, dirty state and toasts behave
 * identically across the CMS.
 */
export function SettingsForm({
  fields,
  values: initialValues,
  action,
  title,
  description,
  submitLabel = "Save changes",
  children,
}: {
  fields: Field[];
  values: Record<string, unknown>;
  action: (payload: Record<string, unknown>) => Promise<ActionResult>;
  title?: string;
  description?: string;
  submitLabel?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const groups = Array.from(new Set(fields.map((field) => field.group ?? "General")));

  const submit = () =>
    startTransition(async () => {
      const result = await action(values);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast.error(result.message);
        return;
      }
      setErrors({});
      setDirty(false);
      toast.success(result.message ?? "Saved.");
      router.refresh();
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {groups.map((group) => (
        <div key={group} className="mb-4">
          <Card>
            <CardTitle
              title={groups.length > 1 ? group : (title ?? group)}
              description={groups.length > 1 ? undefined : description}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              {fields
                .filter((field) => (field.group ?? "General") === group)
                .map((field) => (
                  <FieldInput
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    error={errors[field.name] || undefined}
                    siblingValues={values}
                    onChange={(value) => {
                      setDirty(true);
                      setValues((current) => ({ ...current, [field.name]: value }));
                    }}
                  />
                ))}
            </div>
          </Card>
        </div>
      ))}

      {children}

      <div className="sticky bottom-4 mt-5 flex items-center justify-end gap-3 rounded-xl border border-[var(--a-border)] bg-[color-mix(in_oklab,var(--a-panel)_92%,transparent)] px-4 py-3 backdrop-blur">
        {dirty ? (
          <span className="mr-auto text-[12.5px] text-warning">Unsaved changes</span>
        ) : (
          <span className="mr-auto text-[12.5px] text-[var(--a-subtle)]">All changes saved</span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
