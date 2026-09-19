"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Eye, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FieldInput, type RelationOption } from "@/components/admin/field-input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteResourceAction, saveResourceAction } from "@/app/admin/actions";
import { cn, slugify } from "@/lib/utils";
import type { ResourceConfig } from "@/lib/admin/fields";

type Props = {
  config: ResourceConfig;
  record: Record<string, unknown> | null;
  relationOptions: Record<string, RelationOption[]>;
  canDelete: boolean;
  canPublish: boolean;
};

export function ResourceForm({ config, record, relationOptions, canDelete, canPublish }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(config, record));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState(config.groups[0] ?? "Content");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dirty, setDirty] = useState(false);

  const id = (record?.id as string | undefined) ?? null;
  const title = String(values[config.titleField] ?? "");

  const groups = useMemo(
    () =>
      config.groups.filter((group) => config.fields.some((field) => (field.group ?? "Content") === group)),
    [config],
  );

  const set = (name: string, value: unknown) => {
    setDirty(true);
    setValues((current) => {
      const next = { ...current, [name]: value };

      // Keep the slug in step with the title until it has been edited by hand.
      if (config.slugField && name === config.titleField && !id) {
        const currentSlug = String(current[config.slugField] ?? "");
        const expected = slugify(String(current[config.titleField] ?? ""));
        if (!currentSlug || currentSlug === expected) {
          next[config.slugField] = slugify(String(value ?? ""));
        }
      }
      return next;
    });
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const submit = (afterSave: "stay" | "list", status?: string) => {
    const payload = status ? { ...values, status } : values;

    startTransition(async () => {
      const result = await saveResourceAction(config.key, id, payload);

      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast.error(result.message);
        // Jump to the tab holding the first error so it is never hidden.
        const firstError = Object.keys(result.errors ?? {})[0];
        if (firstError) {
          const field = config.fields.find((item) => item.name === firstError);
          if (field?.group) setActiveGroup(field.group);
        }
        return;
      }

      setDirty(false);
      if (status) setValues((current) => ({ ...current, status }));
      toast.success(result.message ?? "Saved.");

      if (afterSave === "list") {
        router.push(`/admin/${config.key}`);
        router.refresh();
      } else if (!id && result.data?.id) {
        router.replace(`/admin/${config.key}/${result.data.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const remove = () => {
    if (!id) return;
    startTransition(async () => {
      const result = await deleteResourceAction(config.key, id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Deleted.");
      router.push(`/admin/${config.key}`);
      router.refresh();
    });
  };

  // Drafts are viewable through the preview flag, which only works for
  // signed-in CMS users — visitors still get a 404.
  const isPublished = !config.hasStatus || values.status === "PUBLISHED";
  const publicUrl =
    config.publicPath && config.slugField && values[config.slugField]
      ? `${config.publicPath}/${values[config.slugField]}${isPublished ? "" : "?preview=1"}`
      : null;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/admin/${config.key}`}
            className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-[var(--a-muted)] transition-colors hover:text-[var(--a-fg)]"
          >
            <ArrowLeft className="size-3.5" />
            {config.label}
          </Link>
          <h1 className="truncate text-[22px] font-semibold tracking-tight text-[var(--a-fg-strong)]">
            {id ? title || config.singular : `New ${config.singular.toLowerCase()}`}
          </h1>
          {dirty ? (
            <p className="mt-1 text-[12.5px] text-warning">Unsaved changes</p>
          ) : id ? (
            <p className="mt-1 text-[12.5px] text-[var(--a-subtle)]">All changes saved</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {publicUrl && values.status === "PUBLISHED" ? (
            <Link
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[13px] text-[var(--a-muted)] transition-colors hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]"
            >
              <Eye className="size-3.5" />
              View
              <ExternalLink className="size-3" />
            </Link>
          ) : null}

          {config.hasStatus ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => submit("stay", "DRAFT")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3.5 text-[13px] font-medium text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] disabled:opacity-60"
            >
              Save draft
            </button>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={() =>
              submit("stay", config.hasStatus && canPublish ? "PUBLISHED" : undefined)
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {config.hasStatus && canPublish ? "Save & publish" : "Save"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-[var(--a-border)] pb-px">
        {groups.map((group) => {
          const groupHasError = config.fields.some(
            (field) => (field.group ?? "Content") === group && errors[field.name],
          );
          return (
            <button
              key={group}
              type="button"
              onClick={() => setActiveGroup(group)}
              className={cn(
                "relative whitespace-nowrap px-3.5 py-2.5 text-[13.5px] transition-colors",
                activeGroup === group
                  ? "font-medium text-[var(--a-fg-strong)]"
                  : "text-[var(--a-muted)] hover:text-[var(--a-fg)]",
              )}
            >
              {group}
              {groupHasError ? (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-danger" />
              ) : null}
              {activeGroup === group ? (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Fields */}
      <div className="rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)] p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {config.fields
            .filter((field) => (field.group ?? "Content") === activeGroup)
            .filter((field) => canPublish || field.name !== "status")
            .map((field) => (
              <FieldInput
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(value) => set(field.name, value)}
                error={errors[field.name]}
                relationOptions={field.source ? relationOptions[field.source] : undefined}
                siblingValues={values}
              />
            ))}
        </div>
      </div>

      {/* Danger zone */}
      {id && canDelete ? (
        <div className="mt-6 rounded-xl border border-danger/25 bg-danger/[0.04] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[14px] font-medium text-[var(--a-fg-strong)]">
                Delete this {config.singular.toLowerCase()}
              </h2>
              <p className="mt-1 text-[12.5px] text-[var(--a-muted)]">
                A snapshot is kept in the revision history, but the live entry is removed
                immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-danger/40 px-3.5 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${title || config.singular.toLowerCase()}?`}
        description="This removes the entry from the website immediately. A revision snapshot is kept so it can be restored by an administrator."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          remove();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function initialValues(
  config: ResourceConfig,
  record: Record<string, unknown> | null,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of config.fields) {
    const raw = record?.[field.name];

    switch (field.type) {
      case "switch":
        values[field.name] = Boolean(raw);
        break;
      case "list":
        values[field.name] = Array.isArray(raw) ? raw : [];
        break;
      case "repeater":
        values[field.name] = Array.isArray(raw) ? raw : [];
        break;
      case "multirelation":
        values[field.name] = Array.isArray(raw) ? raw : [];
        break;
      case "tags":
        values[field.name] = Array.isArray(raw) ? raw : [];
        break;
      case "number":
        values[field.name] = raw ?? "";
        break;
      case "select":
        values[field.name] =
          raw ?? (field.name === "status" ? "DRAFT" : (field.options?.[0]?.value ?? ""));
        break;
      default:
        values[field.name] = raw ?? "";
    }
  }

  return values;
}
