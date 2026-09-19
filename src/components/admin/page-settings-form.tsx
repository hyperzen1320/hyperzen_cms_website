"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardTitle } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImageField } from "@/components/admin/media-picker";
import { deletePageAction, savePageAction } from "@/app/admin/pages/actions";
import { cn, slugify } from "@/lib/utils";

type PageRecord = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  isSystem: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
};

export function PageSettingsForm({
  page,
  canDelete,
}: {
  page: PageRecord | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState({
    title: page?.title ?? "",
    slug: page?.slug ?? "",
    description: page?.description ?? "",
    status: page?.status ?? "DRAFT",
    seoTitle: page?.seoTitle ?? "",
    seoDescription: page?.seoDescription ?? "",
    ogImage: page?.ogImage ?? "",
    canonicalUrl: page?.canonicalUrl ?? "",
    noIndex: page?.noIndex ?? false,
  });

  const set = (key: keyof typeof values, value: string | boolean) =>
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !page) {
        const expected = slugify(String(current.title));
        if (!current.slug || current.slug === expected) next.slug = slugify(String(value));
      }
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const result = await savePageAction(page?.id ?? null, {
        ...values,
        status: values.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      });
      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Saved.");
      setErrors({});
      if (!page && result.data) router.push(`/admin/pages/${result.data.id}`);
      else router.refresh();
    });

  return (
    <Card>
      <CardTitle
        title="Page settings"
        description="Title, URL and SEO for this page."
        action={
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="a-label">Title</span>
          <input
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
            className={cn("a-input", errors.title && "border-danger/60")}
          />
        </label>

        <label className="block">
          <span className="a-label">URL slug</span>
          <input
            value={values.slug}
            disabled={page?.isSystem}
            onChange={(event) => set("slug", slugify(event.target.value))}
            className={cn("a-input font-mono text-[13px]", errors.slug && "border-danger/60")}
          />
          {page?.isSystem ? (
            <span className="mt-1.5 block text-[12px] text-[var(--a-subtle)]">
              System pages have a fixed URL.
            </span>
          ) : null}
        </label>

        <label className="block sm:col-span-2">
          <span className="a-label">Description</span>
          <textarea
            rows={2}
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            className="a-input h-auto resize-y py-2.5"
          />
        </label>

        <label className="block">
          <span className="a-label">Status</span>
          <select
            value={values.status}
            onChange={(event) => set("status", event.target.value)}
            className="a-input"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>

        <label className="block">
          <span className="a-label">Canonical URL</span>
          <input
            value={values.canonicalUrl}
            onChange={(event) => set("canonicalUrl", event.target.value)}
            placeholder="https://"
            className="a-input"
          />
        </label>

        <label className="block">
          <span className="a-label">SEO title</span>
          <input
            value={values.seoTitle}
            onChange={(event) => set("seoTitle", event.target.value)}
            className="a-input"
          />
        </label>

        <label className="block">
          <span className="a-label">Meta description</span>
          <textarea
            rows={2}
            value={values.seoDescription}
            onChange={(event) => set("seoDescription", event.target.value)}
            className="a-input h-auto resize-y py-2.5"
          />
        </label>

        <div className="sm:col-span-2">
          <span className="a-label">Social share image</span>
          <ImageField value={values.ogImage} onChange={(value) => set("ogImage", value)} />
        </div>

        <label className="flex items-center gap-3 sm:col-span-2">
          <button
            type="button"
            role="switch"
            aria-checked={values.noIndex}
            onClick={() => set("noIndex", !values.noIndex)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
              values.noIndex ? "border-transparent" : "border-[var(--a-border)] bg-[var(--a-input)]",
            )}
            style={
              values.noIndex
                ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
                : undefined
            }
          >
            <span
              className={cn(
                "inline-block size-4 rounded-full bg-white transition-transform",
                values.noIndex ? "translate-x-[22px]" : "translate-x-[3px]",
              )}
            />
          </button>
          <span className="text-[13.5px] text-[var(--a-fg)]">Hide this page from search engines</span>
        </label>
      </div>

      {page && !page.isSystem && canDelete ? (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-danger/25 bg-danger/[0.04] p-4">
          <p className="text-[13px] text-[var(--a-muted)]">
            Deleting a page removes it and all of its sections.
          </p>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-danger/40 px-3.5 text-[13px] text-danger transition-colors hover:bg-danger/10"
          >
            <Trash2 className="size-3.5" />
            Delete page
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${values.title}"?`}
        description="The page and every section on it are removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (!page) return;
          startTransition(async () => {
            const result = await deletePageAction(page.id);
            if (result.ok) {
              toast.success(result.message ?? "Deleted.");
              router.push("/admin/pages");
              router.refresh();
            } else {
              toast.error(result.message);
            }
          });
        }}
      />
    </Card>
  );
}
