"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ImageIcon, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";

export type MediaItem = {
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
};

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { ok: boolean; media?: MediaItem[] };
      setItems(data.media ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, loading, load, setItems };
}

export async function uploadFile(file: File): Promise<MediaItem | null> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/media", { method: "POST", body: formData });
  const data = (await response.json()) as {
    ok: boolean;
    message?: string;
    media?: { id: string; url: string; filename: string; mimeType: string; size: number };
  };

  if (!data.ok || !data.media) {
    toast.error(data.message ?? "Upload failed.");
    return null;
  }

  return {
    ...data.media,
    originalName: file.name,
    type: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
    alt: null,
  };
}

/** Modal media browser used by every image field and the media library page. */
export function MediaPickerDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}) {
  const { items, loading, load, setItems } = useMediaLibrary();
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void load(query), 250);
    return () => clearTimeout(timer);
  }, [query, open, load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const uploaded: MediaItem[] = [];
    for (const file of Array.from(files)) {
      const item = await uploadFile(file);
      if (item) uploaded.push(item);
    }
    setUploading(false);
    if (uploaded.length) {
      setItems((current) => [...uploaded, ...current]);
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded.`);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Media library"
            className="admin flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-panel)] shadow-[var(--a-shadow)]"
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-[var(--a-border)] px-5 py-3">
              <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">Media library</h2>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--a-subtle)]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search files"
                    className="h-9 w-48 rounded-lg border border-[var(--a-border)] bg-[var(--a-input)] pl-8 pr-3 text-[13px] text-[var(--a-fg)] outline-none focus:border-[color-mix(in_oklab,var(--accent)_55%,transparent)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                >
                  {uploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  Upload
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-lg text-[var(--a-muted)] hover:bg-[var(--a-hover)]"
                >
                  <X className="size-4" />
                </button>
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
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="aspect-square animate-pulse rounded-lg bg-[var(--a-hover)]"
                    />
                  ))}
                </div>
              ) : items.length ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                        className="group relative block w-full overflow-hidden rounded-lg border border-[var(--a-border)] transition-colors hover:border-[color-mix(in_oklab,var(--accent)_60%,transparent)]"
                      >
                        <span className="flex aspect-square items-center justify-center bg-[var(--a-panel-2)]">
                          {item.type === "IMAGE" ? (
                            <img
                              src={item.url}
                              alt={item.alt ?? item.originalName}
                              className="size-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon className="size-6 text-[var(--a-subtle)]" />
                          )}
                        </span>
                        <span className="block border-t border-[var(--a-border)] px-2.5 py-2 text-left">
                          <span className="block truncate text-[12px] text-[var(--a-fg)]">
                            {item.originalName}
                          </span>
                          <span className="block text-[11px] text-[var(--a-subtle)]">
                            {formatBytes(item.size)}
                          </span>
                        </span>
                        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                          <Check className="size-6 text-white" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-[14px] font-medium text-[var(--a-fg)]">No media yet</p>
                  <p className="mx-auto mt-2 max-w-xs text-[13px] text-[var(--a-muted)]">
                    Upload images, video or PDFs and they become available across the CMS.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Image field: preview, pick from library, upload, or paste a URL. */
export function ImageField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-panel-2)]",
          )}
        >
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-[var(--a-subtle)]" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="/uploads/example.jpg or https://…"
            aria-label={label ?? "Image URL"}
            className="a-input"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
            >
              <ImageIcon className="size-3.5" />
              Library
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              Upload
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-danger transition-colors hover:border-danger/40"
              >
                <Trash2 className="size-3.5" />
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setUploading(true);
          const item = await uploadFile(file);
          setUploading(false);
          if (item) {
            onChange(item.url);
            toast.success("Image uploaded.");
          }
        }}
      />

      <MediaPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(item) => onChange(item.url)}
      />
    </div>
  );
}
