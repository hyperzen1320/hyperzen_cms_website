"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  FileText,
  Film,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, EmptyState } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { uploadFile } from "@/components/admin/media-picker";
import { deleteMediaAction, updateMediaAction } from "@/app/admin/settings/actions";
import { cn, formatBytes, formatDate } from "@/lib/utils";

type Item = {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  type: string;
  size: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  title?: string | null;
  storage: string;
  createdAt: string;
};

export function MediaLibrary({ items, canDelete }: { items: Item[]; canDelete: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "IMAGE" | "VIDEO" | "DOCUMENT">("ALL");
  const [selected, setSelected] = useState<Item | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = items.filter((item) => {
    if (filter !== "ALL" && item.type !== filter) return false;
    if (!query.trim()) return true;
    const needle = query.toLowerCase();
    return (
      item.originalName.toLowerCase().includes(needle) ||
      item.filename.toLowerCase().includes(needle) ||
      (item.alt ?? "").toLowerCase().includes(needle)
    );
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of Array.from(files)) {
      const result = await uploadFile(file);
      if (result) uploaded += 1;
    }
    setUploading(false);
    if (uploaded) {
      toast.success(`${uploaded} file${uploaded > 1 ? "s" : ""} uploaded.`);
      router.refresh();
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1600);
      toast.success("URL copied.");
    } catch {
      toast.error("Could not copy the URL.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--a-subtle)]" />
            <label htmlFor="media-search" className="sr-only">
              Search media
            </label>
            <input
              id="media-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files"
              className="a-input pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {(["ALL", "IMAGE", "VIDEO", "DOCUMENT"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-[12.5px] capitalize transition-colors",
                    filter === value
                      ? "border-[var(--a-border-strong)] bg-[var(--a-active)] text-[var(--a-fg-strong)]"
                      : "border-[var(--a-border)] text-[var(--a-muted)] hover:border-[var(--a-border-strong)]",
                  )}
                >
                  {value.toLowerCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Upload
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,application/pdf"
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        {visible.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className={cn(
                    "group block w-full overflow-hidden rounded-xl border text-left transition-colors",
                    selected?.id === item.id
                      ? "border-[color-mix(in_oklab,var(--accent)_60%,transparent)]"
                      : "border-[var(--a-border)] hover:border-[var(--a-border-strong)]",
                  )}
                >
                  <span className="flex aspect-[4/3] items-center justify-center bg-[var(--a-panel-2)]">
                    {item.type === "IMAGE" ? (
                      <img
                        src={item.url}
                        alt={item.alt ?? item.originalName}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : item.type === "VIDEO" ? (
                      <Film className="size-7 text-[var(--a-subtle)]" />
                    ) : (
                      <FileText className="size-7 text-[var(--a-subtle)]" />
                    )}
                  </span>
                  <span className="block border-t border-[var(--a-border)] bg-[var(--a-panel)] px-3 py-2.5">
                    <span className="block truncate text-[12.5px] text-[var(--a-fg)]">
                      {item.originalName}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-[var(--a-subtle)]">
                      {formatBytes(item.size)}
                      {item.width ? ` · ${item.width}×${item.height}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={query || filter !== "ALL" ? "No matching files" : "No media yet"}
            description={
              query || filter !== "ALL"
                ? "Try a different search term or filter."
                : "Upload images, video or PDFs. Everything here is available in every content editor."
            }
          />
        )}
      </div>

      {/* Details panel */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        {selected ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-[14px] font-medium text-[var(--a-fg-strong)]">File details</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="grid size-7 place-items-center rounded-md text-[var(--a-muted)] hover:bg-[var(--a-hover)]"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-panel-2)]">
              {selected.type === "IMAGE" ? (
                <img
                  src={selected.url}
                  alt={selected.alt ?? selected.originalName}
                  className="max-h-48 w-full object-contain"
                />
              ) : (
                <div className="grid h-32 place-items-center">
                  <ImageIcon className="size-8 text-[var(--a-subtle)]" />
                </div>
              )}
            </div>

            <dl className="mt-4 space-y-2 text-[12.5px]">
              {[
                ["Name", selected.originalName],
                ["Type", selected.mimeType],
                ["Size", formatBytes(selected.size)],
                selected.width ? ["Dimensions", `${selected.width} × ${selected.height}`] : null,
                ["Storage", selected.storage === "db" ? "Database" : "Local disk"],
                ["Uploaded", formatDate(selected.createdAt)],
              ]
                .filter(Boolean)
                .map((row) => {
                  const [label, value] = row as [string, string];
                  return (
                    <div key={label} className="flex gap-3">
                      <dt className="w-24 shrink-0 text-[var(--a-subtle)]">{label}</dt>
                      <dd className="min-w-0 flex-1 break-words text-[var(--a-fg)]">{value}</dd>
                    </div>
                  );
                })}
            </dl>

            <MediaDetailsForm
              key={selected.id}
              item={selected}
              pending={pending}
              onSave={(alt, title) =>
                startTransition(async () => {
                  const result = await updateMediaAction(selected.id, { alt, title });
                  if (result.ok) {
                    toast.success(result.message ?? "Saved.");
                    router.refresh();
                  } else {
                    toast.error(result.message);
                  }
                })
              }
            />

            <button
              type="button"
              onClick={() => copy(selected.url)}
              className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--a-border)] text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
            >
              {copied === selected.url ? (
                <>
                  <Check className="size-3.5 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy URL
                </>
              )}
            </button>

            {canDelete ? (
              <button
                type="button"
                onClick={() => setPendingDelete(selected)}
                className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-danger/40 text-[13px] text-danger transition-colors hover:bg-danger/10"
              >
                <Trash2 className="size-3.5" />
                Delete file
              </button>
            ) : null}
          </Card>
        ) : (
          <Card>
            <p className="text-[13px] text-[var(--a-muted)]">
              Select a file to edit its alt text, copy its URL or remove it.
            </p>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete "${pendingDelete?.originalName ?? ""}"?`}
        description="The file is removed permanently. Anywhere it is referenced will show a broken image until you replace it."
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (!target) return;
          startTransition(async () => {
            const result = await deleteMediaAction(target.id);
            if (result.ok) {
              toast.success(result.message ?? "Deleted.");
              setSelected(null);
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

function MediaDetailsForm({
  item,
  pending,
  onSave,
}: {
  item: Item;
  pending: boolean;
  onSave: (alt: string, title: string) => void;
}) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [title, setTitle] = useState(item.title ?? "");

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(alt, title);
      }}
    >
      <label className="block">
        <span className="a-label">Alt text</span>
        <input
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="Describe the image for screen readers"
          className="a-input"
        />
      </label>
      <label className="block">
        <span className="a-label">Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="a-input"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Save details
      </button>
    </form>
  );
}
