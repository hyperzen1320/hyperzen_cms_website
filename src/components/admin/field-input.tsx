"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { ImageField } from "@/components/admin/media-picker";
import { ICON_NAMES, Icon } from "@/components/ui/icon";
import { cn, slugify } from "@/lib/utils";
import type { Field, SubField } from "@/lib/admin/fields";

const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] animate-pulse rounded-lg border border-[var(--a-border)] bg-[var(--a-hover)]" />
    ),
  },
);

export type RelationOption = { value: string; label: string };

export function FieldInput({
  field,
  value,
  onChange,
  error,
  relationOptions,
  siblingValues,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  relationOptions?: RelationOption[];
  siblingValues?: Record<string, unknown>;
}) {
  const id = `field-${field.name}`;

  return (
    <div className={cn(field.width === "half" ? "sm:col-span-1" : "sm:col-span-2")}>
      <label htmlFor={id} className="a-label">
        {field.label}
        {field.required ? <span className="ml-1 text-[var(--accent)]">*</span> : null}
      </label>

      {renderControl({ id, field, value, onChange, error, relationOptions, siblingValues })}

      {field.help && !error ? (
        <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--a-subtle)]">{field.help}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function renderControl({
  id,
  field,
  value,
  onChange,
  error,
  relationOptions,
  siblingValues,
}: {
  id: string;
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  relationOptions?: RelationOption[];
  siblingValues?: Record<string, unknown>;
}) {
  const invalid = Boolean(error);
  const inputClass = cn("a-input", invalid && "border-danger/60");

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          id={id}
          rows={field.rows ?? 4}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, "h-auto resize-y py-2.5 leading-relaxed")}
        />
      );

    case "richtext":
      return (
        <RichTextEditor
          value={String(value ?? "")}
          onChange={(html) => onChange(html)}
          placeholder={field.placeholder}
        />
      );

    case "number":
      return (
        <input
          id={id}
          type="number"
          value={value === null || value === undefined ? "" : String(value)}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      );

    case "date":
      return (
        <input
          id={id}
          type="date"
          value={toDateInput(value)}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      );

    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={`${field.label} colour picker`}
            value={/^#[0-9a-f]{6}$/i.test(String(value ?? "")) ? String(value) : "#5b8cff"}
            onChange={(event) => onChange(event.target.value)}
            className="size-10 shrink-0 cursor-pointer rounded-lg border border-[var(--a-border)] bg-transparent p-1"
          />
          <input
            id={id}
            value={String(value ?? "")}
            placeholder="#5B8CFF"
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        </div>
      );

    case "switch":
      return (
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={Boolean(value)}
          onClick={() => onChange(!value)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
            value
              ? "border-transparent"
              : "border-[var(--a-border)] bg-[var(--a-input)]",
          )}
          style={
            value
              ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
              : undefined
          }
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-white transition-transform",
              value ? "translate-x-[22px]" : "translate-x-[3px]",
            )}
          />
        </button>
      );

    case "select":
      return (
        <div className="relative">
          <select
            id={id}
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
            className={cn(inputClass, "appearance-none pr-9")}
          >
            {!field.required ? <option value="">Select…</option> : null}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--a-subtle)]" />
        </div>
      );

    case "relation":
      return (
        <div className="relative">
          <select
            id={id}
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
            className={cn(inputClass, "appearance-none pr-9")}
          >
            <option value="">None</option>
            {relationOptions?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--a-subtle)]" />
        </div>
      );

    case "multirelation": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-input)] p-2.5">
          {relationOptions?.length ? (
            relationOptions.map((option) => {
              const active = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange(
                      active
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value],
                    )
                  }
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[12.5px] transition-colors",
                    active
                      ? "border-[color-mix(in_oklab,var(--accent)_55%,transparent)] bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-[var(--a-fg-strong)]"
                      : "border-[var(--a-border)] text-[var(--a-muted)] hover:border-[var(--a-border-strong)]",
                  )}
                >
                  {option.label}
                </button>
              );
            })
          ) : (
            <p className="text-[12.5px] text-[var(--a-subtle)]">Nothing available to link yet.</p>
          )}
        </div>
      );
    }

    case "image":
      return (
        <ImageField
          value={String(value ?? "")}
          onChange={(next) => onChange(next)}
          label={field.label}
        />
      );

    case "list":
      return (
        <textarea
          id={id}
          rows={field.rows ?? 5}
          value={Array.isArray(value) ? (value as string[]).join("\n") : String(value ?? "")}
          placeholder={field.placeholder ?? "One item per line"}
          onChange={(event) => onChange(event.target.value.split("\n"))}
          className={cn(inputClass, "h-auto resize-y py-2.5 font-mono text-[13px] leading-relaxed")}
        />
      );

    case "repeater":
      return (
        <Repeater
          subfields={field.subfields ?? []}
          items={Array.isArray(value) ? (value as Record<string, string>[]) : []}
          onChange={(items) => onChange(items)}
        />
      );

    case "icon":
      return <IconPicker value={String(value ?? "")} onChange={onChange} id={id} />;

    case "tags":
      return (
        <input
          id={id}
          value={Array.isArray(value) ? (value as string[]).join(", ") : String(value ?? "")}
          placeholder="engineering, ai, performance"
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      );

    case "slug":
      return (
        <div className="flex items-center gap-2">
          <input
            id={id}
            value={String(value ?? "")}
            placeholder={field.placeholder ?? "url-slug"}
            onChange={(event) => onChange(slugify(event.target.value))}
            className={cn(inputClass, "font-mono text-[13px]")}
          />
          {field.slugFrom ? (
            <button
              type="button"
              onClick={() => onChange(slugify(String(siblingValues?.[field.slugFrom!] ?? "")))}
              className="h-10 shrink-0 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-[var(--a-muted)] transition-colors hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]"
            >
              Generate
            </button>
          ) : null}
        </div>
      );

    default:
      return (
        <input
          id={id}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      );
  }
}

function toDateInput(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Repeater
// ---------------------------------------------------------------------------

function Repeater({
  subfields,
  items,
  onChange,
}: {
  subfields: SubField[];
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
}) {
  const update = (index: number, key: string, value: string) => {
    const next = items.map((item, position) =>
      position === index ? { ...item, [key]: value } : item,
    );
    onChange(next);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChange(next);
  };

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--a-border)] bg-[var(--a-panel-2)] p-3.5"
        >
          <div className="mb-2.5 flex items-center gap-2">
            <GripVertical className="size-3.5 text-[var(--a-subtle)]" />
            <span className="text-[11.5px] font-medium uppercase tracking-wider text-[var(--a-subtle)]">
              Item {index + 1}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                aria-label="Move up"
                className="grid size-7 place-items-center rounded-md text-[var(--a-muted)] hover:bg-[var(--a-hover)] disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="grid size-7 place-items-center rounded-md text-[var(--a-muted)] hover:bg-[var(--a-hover)] disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, position) => position !== index))}
                aria-label="Remove item"
                className="grid size-7 place-items-center rounded-md text-danger hover:bg-danger/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {subfields.map((subfield) => (
              <div
                key={subfield.name}
                className={subfield.type === "textarea" ? "sm:col-span-2" : ""}
              >
                <label className="mb-1 block text-[12px] text-[var(--a-muted)]">
                  {subfield.label}
                </label>
                {subfield.type === "textarea" ? (
                  <textarea
                    rows={2}
                    value={item[subfield.name] ?? ""}
                    placeholder={subfield.placeholder}
                    onChange={(event) => update(index, subfield.name, event.target.value)}
                    className="a-input h-auto resize-y py-2 leading-relaxed"
                  />
                ) : subfield.type === "icon" ? (
                  <IconPicker
                    value={item[subfield.name] ?? ""}
                    onChange={(next) => update(index, subfield.name, String(next))}
                  />
                ) : (
                  <input
                    value={item[subfield.name] ?? ""}
                    placeholder={subfield.placeholder}
                    onChange={(event) => update(index, subfield.name, event.target.value)}
                    className="a-input"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            Object.fromEntries(subfields.map((subfield) => [subfield.name, ""])),
          ])
        }
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-[var(--a-border-strong)] px-3.5 text-[13px] text-[var(--a-muted)] transition-colors hover:border-[color-mix(in_oklab,var(--accent)_50%,transparent)] hover:text-[var(--a-fg)]"
      >
        <Plus className="size-3.5" />
        Add item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon picker
// ---------------------------------------------------------------------------

function IconPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const container = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, the way a select would.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const matches = ICON_NAMES.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 60);

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-[var(--a-border)] bg-[var(--a-input)] px-3 text-left text-[13.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
      >
        <Icon name={value} className="size-4 text-[var(--accent)]" />
        <span className="truncate">{value || "Choose an icon"}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 text-[var(--a-subtle)]" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1.5 w-full min-w-[280px] overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-elevated)] shadow-[var(--a-shadow)]">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search icons"
            className="w-full border-b border-[var(--a-border)] bg-transparent px-3 py-2.5 text-[13px] text-[var(--a-fg)] outline-none placeholder:text-[var(--a-subtle)]"
          />
          <div className="grid max-h-56 grid-cols-6 gap-1 overflow-y-auto p-2">
            {matches.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "grid aspect-square place-items-center rounded-md transition-colors hover:bg-[var(--a-hover)]",
                  value === name && "bg-[var(--a-active)] text-[var(--accent)]",
                )}
              >
                <Icon name={name} className="size-4" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
