"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { FieldInput } from "@/components/admin/field-input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/ui";
import {
  addSectionAction,
  deleteSectionAction,
  duplicateSectionAction,
  reorderSectionsAction,
  toggleSectionAction,
  updateSectionAction,
} from "@/app/admin/pages/actions";
import { BLOCKS, BLOCK_SETTINGS_FIELDS, getBlock } from "@/lib/admin/blocks";
import { cn } from "@/lib/utils";

export type BuilderSection = {
  id: string;
  blockType: string;
  name: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  order: number;
  isVisible: boolean;
};

export function PageBuilder({
  pageId,
  pageSlug,
  sections: initialSections,
  canDelete,
  canPublish,
}: {
  pageId: string;
  pageSlug: string;
  sections: BuilderSection[];
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sections, setSections] = useState(initialSections);
  const [selectedId, setSelectedId] = useState<string | null>(initialSections[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BuilderSection | null>(null);

  const selected = sections.find((section) => section.id === selectedId) ?? null;

  const run = (action: () => Promise<{ ok: boolean; message?: string }>, quiet = false) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (!quiet) toast.success(result.message ?? "Saved.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });

  const move = (id: string, direction: -1 | 1) => {
    const index = sections.findIndex((section) => section.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return;

    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    setSections(next);
    run(() => reorderSectionsAction(pageId, next.map((section) => section.id)), true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* Section list */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <div className="rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)]">
          <div className="flex items-center justify-between border-b border-[var(--a-border)] px-4 py-3">
            <h2 className="flex items-center gap-2 text-[14px] font-medium text-[var(--a-fg-strong)]">
              <Layers className="size-4 text-[var(--a-muted)]" />
              Sections
            </h2>
            <span className="text-[12px] text-[var(--a-subtle)]">{sections.length}</span>
          </div>

          {sections.length ? (
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {sections.map((section, index) => {
                const definition = getBlock(section.blockType);
                const active = section.id === selectedId;
                return (
                  <li key={section.id}>
                    <div
                      className={cn(
                        "group mb-1 flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                        active
                          ? "border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
                          : "border-transparent hover:bg-[var(--a-hover)]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(section.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span
                          className={cn(
                            "block truncate text-[13px]",
                            section.isVisible
                              ? "text-[var(--a-fg-strong)]"
                              : "text-[var(--a-subtle)] line-through",
                          )}
                        >
                          {section.name || definition?.label || section.blockType}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--a-subtle)]">
                          {definition?.label ?? section.blockType}
                        </span>
                      </button>

                      <div className="flex shrink-0 flex-col">
                        <button
                          type="button"
                          onClick={() => move(section.id, -1)}
                          disabled={index === 0 || pending}
                          aria-label="Move up"
                          className="grid size-4 place-items-center text-[var(--a-subtle)] hover:text-[var(--a-fg)] disabled:opacity-30"
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(section.id, 1)}
                          disabled={index === sections.length - 1 || pending}
                          aria-label="Move down"
                          className="grid size-4 place-items-center text-[var(--a-subtle)] hover:text-[var(--a-fg)] disabled:opacity-30"
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        hidden={!canPublish}
                        onClick={() => run(() => toggleSectionAction(section.id, !section.isVisible))}
                        aria-label={section.isVisible ? "Hide section" : "Show section"}
                        className="grid size-7 shrink-0 place-items-center rounded text-[var(--a-subtle)] hover:bg-[var(--a-active)] hover:text-[var(--a-fg)]"
                      >
                        {section.isVisible ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--a-muted)]">
              No sections yet.
            </p>
          )}

          <div className="border-t border-[var(--a-border)] p-2">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--a-border-strong)] text-[13px] text-[var(--a-muted)] transition-colors hover:border-[color-mix(in_oklab,var(--accent)_50%,transparent)] hover:text-[var(--a-fg)]"
            >
              <Plus className="size-3.5" />
              Add block
            </button>
          </div>
        </div>

        <Link
          href={pageSlug === "home" ? "/" : `/${pageSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--a-border)] text-[13px] text-[var(--a-muted)] transition-colors hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]"
        >
          Preview page
          <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {/* Editor */}
      <div>
        {selected ? (
          <SectionEditor
            key={selected.id}
            section={selected}
            pending={pending}
            canDelete={canDelete}
            onSave={(payload) => run(() => updateSectionAction(selected.id, payload))}
            onDuplicate={() => run(() => duplicateSectionAction(selected.id))}
            onDelete={() => setPendingDelete(selected)}
          />
        ) : (
          <EmptyState
            title="No section selected"
            description="Add a block to start composing this page. Blocks render on the website in the order shown on the left."
          />
        )}
      </div>

      {/* Block picker */}
      <AnimatePresence>
        {adding ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setAdding(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Add a block"
              className="admin max-h-[82vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-panel)] shadow-[var(--a-shadow)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--a-border)] px-5 py-3.5">
                <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">Add a block</h2>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] hover:bg-[var(--a-hover)]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="max-h-[68vh] overflow-y-auto p-5">
                {["Layout", "Content", "Collections", "Conversion"].map((category) => {
                  const blocks = BLOCKS.filter((block) => block.category === category);
                  if (!blocks.length) return null;
                  return (
                    <div key={category} className="mb-6 last:mb-0">
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--a-subtle)]">
                        {category}
                      </p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {blocks.map((block) => (
                          <li key={block.type}>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                setAdding(false);
                                startTransition(async () => {
                                  const result = await addSectionAction(pageId, block.type);
                                  if (result.ok && result.data) {
                                    toast.success(result.message ?? "Block added.");
                                    setSelectedId(result.data.id);
                                    router.refresh();
                                  } else if (!result.ok) {
                                    toast.error(result.message);
                                  }
                                });
                              }}
                              className="w-full rounded-lg border border-[var(--a-border)] p-3.5 text-left transition-colors hover:border-[color-mix(in_oklab,var(--accent)_50%,transparent)] hover:bg-[var(--a-hover)] disabled:opacity-60"
                            >
                              <span className="block text-[13.5px] font-medium text-[var(--a-fg-strong)]">
                                {block.label}
                              </span>
                              <span className="mt-1 block text-[12px] leading-relaxed text-[var(--a-muted)]">
                                {block.description}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this section?"
        description="It disappears from the page immediately. You can add it again from the block library."
        confirmLabel="Remove"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (!target) return;
          setSections((current) => current.filter((section) => section.id !== target.id));
          if (selectedId === target.id) setSelectedId(null);
          run(() => deleteSectionAction(target.id));
        }}
      />
    </div>
  );
}

function SectionEditor({
  section,
  pending,
  canDelete,
  onSave,
  onDuplicate,
  onDelete,
}: {
  section: BuilderSection;
  pending: boolean;
  canDelete: boolean;
  onSave: (payload: {
    name: string;
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
  }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const definition = getBlock(section.blockType);
  const [name, setName] = useState(section.name ?? definition?.label ?? section.blockType);
  const [content, setContent] = useState<Record<string, unknown>>(() =>
    initialContent(section),
  );
  const [settings, setSettings] = useState<Record<string, unknown>>(() => ({
    background: "none",
    spacing: "normal",
    width: "default",
    align: "left",
    ...(section.settings ?? {}),
  }));
  const [tab, setTab] = useState<"content" | "design">("content");

  const fields = useMemo(() => definition?.fields ?? [], [definition]);

  if (!definition) {
    return (
      <EmptyState
        title="Unknown block type"
        description={`This page contains a "${section.blockType}" block that the current version of the CMS does not recognise.`}
      />
    );
  }

  return (
    <div className="rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--a-border)] px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Section name"
            className="w-full bg-transparent text-[15px] font-medium text-[var(--a-fg-strong)] outline-none"
          />
          <p className="mt-0.5 text-[11.5px] text-[var(--a-subtle)]">
            {definition.label} · {definition.description}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDuplicate}
            disabled={pending}
            aria-label="Duplicate section"
            className="grid size-9 place-items-center rounded-lg border border-[var(--a-border)] text-[var(--a-muted)] transition-colors hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]"
          >
            <Copy className="size-3.5" />
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              aria-label="Delete section"
              className="grid size-9 place-items-center rounded-lg border border-[var(--a-border)] text-danger transition-colors hover:border-danger/40"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => onSave({ name, content, settings })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save section
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[var(--a-border)] px-4">
        {(["content", "design"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "relative px-3 py-2.5 text-[13.5px] capitalize transition-colors",
              tab === value
                ? "font-medium text-[var(--a-fg-strong)]"
                : "text-[var(--a-muted)] hover:text-[var(--a-fg)]",
            )}
          >
            {value}
            {tab === value ? (
              <span
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
              />
            ) : null}
          </button>
        ))}
      </div>

      <div className="p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {(tab === "content" ? fields : BLOCK_SETTINGS_FIELDS).map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={tab === "content" ? content[field.name] : settings[field.name]}
              onChange={(value) =>
                tab === "content"
                  ? setContent((current) => ({ ...current, [field.name]: value }))
                  : setSettings((current) => ({ ...current, [field.name]: value }))
              }
              siblingValues={tab === "content" ? content : settings}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function initialContent(section: BuilderSection): Record<string, unknown> {
  const definition = getBlock(section.blockType);
  const source = (section.content ?? {}) as Record<string, unknown>;
  const values: Record<string, unknown> = {};

  for (const field of definition?.fields ?? []) {
    const raw = source[field.name];
    switch (field.type) {
      case "switch":
        values[field.name] = Boolean(raw);
        break;
      case "list":
      case "repeater":
        values[field.name] = Array.isArray(raw) ? raw : [];
        break;
      case "number":
        values[field.name] = raw ?? "";
        break;
      default:
        values[field.name] = raw ?? "";
    }
  }

  return values;
}
