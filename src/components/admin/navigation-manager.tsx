"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { FieldInput } from "@/components/admin/field-input";
import {
  deleteNavItemAction,
  reorderNavAction,
  saveNavItemAction,
} from "@/app/admin/settings/actions";
import { cn } from "@/lib/utils";
import type { Field } from "@/lib/admin/fields";
import type { NavLocation } from "@prisma/client";

type NavItem = {
  id: string;
  label: string;
  href: string;
  location: NavLocation;
  parentId: string | null;
  description: string | null;
  icon: string | null;
  badge: string | null;
  order: number;
  isVisible: boolean;
  openInNewTab: boolean;
};

const LOCATIONS: { value: NavLocation; label: string; description: string }[] = [
  { value: "HEADER", label: "Header", description: "Main navigation. Child links become a mega menu." },
  { value: "FOOTER_SERVICES", label: "Footer — Services", description: "First footer column." },
  { value: "FOOTER_COMPANY", label: "Footer — Company", description: "Second footer column." },
  { value: "FOOTER_RESOURCES", label: "Footer — Resources", description: "Third footer column." },
  { value: "FOOTER_LEGAL", label: "Footer — Legal", description: "Bottom legal row." },
];

const FIELDS: Field[] = [
  { name: "label", label: "Label", type: "text", required: true, width: "half" },
  { name: "href", label: "Link", type: "text", required: true, width: "half", placeholder: "/services" },
  { name: "description", label: "Description", type: "text", help: "Shown in the header mega menu." },
  { name: "icon", label: "Icon", type: "icon", width: "half" },
  { name: "badge", label: "Badge", type: "text", width: "half", placeholder: "New" },
  { name: "isVisible", label: "Visible", type: "switch", width: "half" },
  { name: "openInNewTab", label: "Open in a new tab", type: "switch", width: "half" },
];

export function NavigationManager({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<{ item: NavItem | null; location: NavLocation; parentId: string | null } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<NavItem | null>(null);

  const run = (action: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Saved.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });

  const move = (item: NavItem, siblings: NavItem[], direction: -1 | 1) => {
    const ids = siblings.map((sibling) => sibling.id);
    const index = ids.indexOf(item.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    run(() => reorderNavAction(next));
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {LOCATIONS.map((location) => {
          const roots = items
            .filter((item) => item.location === location.value && !item.parentId)
            .sort((a, b) => a.order - b.order);

          return (
            <Card key={location.value} className={location.value === "HEADER" ? "lg:col-span-2" : ""}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">
                    {location.label}
                  </h2>
                  <p className="mt-1 text-[12.5px] text-[var(--a-muted)]">{location.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing({ item: null, location: location.value, parentId: null })}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 text-[12.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
                >
                  <Plus className="size-3.5" />
                  Add link
                </button>
              </div>

              {roots.length ? (
                <ul className="space-y-1.5">
                  {roots.map((item) => {
                    const children = items
                      .filter((child) => child.parentId === item.id)
                      .sort((a, b) => a.order - b.order);

                    return (
                      <li key={item.id}>
                        <NavRow
                          item={item}
                          pending={pending}
                          onEdit={() =>
                            setEditing({ item, location: item.location, parentId: item.parentId })
                          }
                          onDelete={() => setPendingDelete(item)}
                          onToggle={() =>
                            run(() =>
                              saveNavItemAction(item.id, {
                                label: item.label,
                                href: item.href,
                                location: item.location,
                                parentId: item.parentId,
                                description: item.description ?? "",
                                icon: item.icon ?? "",
                                badge: item.badge ?? "",
                                isVisible: !item.isVisible,
                                openInNewTab: item.openInNewTab,
                              }),
                            )
                          }
                          onMove={(direction) => move(item, roots, direction)}
                        />

                        {location.value === "HEADER" ? (
                          <div className="ml-6 mt-1.5 space-y-1.5 border-l border-[var(--a-border)] pl-3">
                            {children.map((child) => (
                              <NavRow
                                key={child.id}
                                item={child}
                                nested
                                pending={pending}
                                onEdit={() =>
                                  setEditing({
                                    item: child,
                                    location: child.location,
                                    parentId: child.parentId,
                                  })
                                }
                                onDelete={() => setPendingDelete(child)}
                                onToggle={() =>
                                  run(() =>
                                    saveNavItemAction(child.id, {
                                      label: child.label,
                                      href: child.href,
                                      location: child.location,
                                      parentId: child.parentId,
                                      description: child.description ?? "",
                                      icon: child.icon ?? "",
                                      badge: child.badge ?? "",
                                      isVisible: !child.isVisible,
                                      openInNewTab: child.openInNewTab,
                                    }),
                                  )
                                }
                                onMove={(direction) => move(child, children, direction)}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({ item: null, location: "HEADER", parentId: item.id })
                              }
                              className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--a-subtle)] transition-colors hover:text-[var(--a-fg)]"
                            >
                              <Plus className="size-3" />
                              Add sub-link
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-[var(--a-border-strong)] px-4 py-6 text-center text-[13px] text-[var(--a-muted)]">
                  No links yet.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {editing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="admin w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-panel)] shadow-[var(--a-shadow)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--a-border)] px-5 py-3.5">
                <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">
                  {editing.item ? "Edit link" : "New link"}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] hover:bg-[var(--a-hover)]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <NavForm
                item={editing.item}
                location={editing.location}
                parentId={editing.parentId}
                pending={pending}
                onSubmit={(values) => {
                  setEditing(null);
                  run(() =>
                    saveNavItemAction(editing.item?.id ?? null, {
                      label: String(values.label ?? ""),
                      href: String(values.href ?? ""),
                      location: editing.location,
                      parentId: editing.parentId,
                      description: String(values.description ?? ""),
                      icon: String(values.icon ?? ""),
                      badge: String(values.badge ?? ""),
                      isVisible: Boolean(values.isVisible),
                      openInNewTab: Boolean(values.openInNewTab),
                    }),
                  );
                }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Remove "${pendingDelete?.label ?? ""}"?`}
        description="The link disappears from the site immediately. Sub-links under it are removed too."
        confirmLabel="Remove"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target) run(() => deleteNavItemAction(target.id));
        }}
      />
    </>
  );
}

function NavRow({
  item,
  nested = false,
  pending,
  onEdit,
  onDelete,
  onToggle,
  onMove,
}: {
  item: NavItem;
  nested?: boolean;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--a-border)] px-3 py-2",
        !item.isVisible && "opacity-55",
      )}
    >
      {item.icon ? <Icon name={item.icon} className="size-4 text-[var(--accent)]" /> : null}

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13.5px] text-[var(--a-fg-strong)]", nested && "text-[13px]")}>
          {item.label}
          {item.badge ? (
            <span className="ml-2 rounded border border-[var(--a-border)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--a-muted)]">
              {item.badge}
            </span>
          ) : null}
        </p>
        <p className="truncate font-mono text-[11.5px] text-[var(--a-subtle)]">{item.href}</p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={pending}
          aria-label="Move up"
          className="grid size-7 place-items-center rounded-md text-[var(--a-subtle)] hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)] disabled:opacity-40"
        >
          <ArrowUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={pending}
          aria-label="Move down"
          className="grid size-7 place-items-center rounded-md text-[var(--a-subtle)] hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)] disabled:opacity-40"
        >
          <ArrowDown className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          aria-label={item.isVisible ? "Hide link" : "Show link"}
          className="grid size-7 place-items-center rounded-md text-[var(--a-subtle)] hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)]"
        >
          {item.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit link"
          className="grid size-7 place-items-center rounded-md text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)]"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete link"
          className="grid size-7 place-items-center rounded-md text-danger hover:bg-danger/10"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function NavForm({
  item,
  location,
  parentId,
  pending,
  onSubmit,
}: {
  item: NavItem | null;
  location: NavLocation;
  parentId: string | null;
  pending: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({
    label: item?.label ?? "",
    href: item?.href ?? "",
    description: item?.description ?? "",
    icon: item?.icon ?? "",
    badge: item?.badge ?? "",
    isVisible: item?.isVisible ?? true,
    openInNewTab: item?.openInNewTab ?? false,
  });

  const fields = FIELDS.filter(
    (field) =>
      location === "HEADER" || !["description", "icon", "badge"].includes(field.name),
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
      className="p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
            siblingValues={values}
          />
        ))}
      </div>

      {parentId ? (
        <p className="mt-3 text-[12.5px] text-[var(--a-muted)]">
          This link appears inside the parent&apos;s mega menu.
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {item ? "Save link" : "Add link"}
        </button>
      </div>
    </form>
  );
}
