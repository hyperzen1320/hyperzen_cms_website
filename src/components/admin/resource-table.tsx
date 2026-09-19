"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import {
  deleteResourceAction,
  reorderResourceAction,
  setStatusAction,
  toggleFeaturedAction,
} from "@/app/admin/actions";
import { cn, formatDate } from "@/lib/utils";
import type { ResourceConfig } from "@/lib/admin/fields";

type Row = Record<string, unknown> & { id: string };

export function ResourceTable({
  config,
  rows,
  canDelete,
  canPublish,
}: {
  config: ResourceConfig;
  rows: Row[];
  canDelete: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [order, setOrder] = useState(rows.map((row) => row.id));

  const sorted = config.hasOrder
    ? [...rows].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
    : rows;

  const run = (action: () => Promise<{ ok: boolean; message?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Updated.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = order.indexOf(id);
    const target = index + direction;
    if (target < 0 || target >= order.length) return;

    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    setOrder(next);
    run(() => reorderResourceAction(config.key, next));
  };

  return (
    <>
      <Table>
        <thead>
          <tr>
            {config.hasOrder ? <Th className="w-14" /> : null}
            {config.listColumns.map((column) => (
              <Th key={column.name} className={column.className}>
                {column.label}
              </Th>
            ))}
            <Th className="w-24 text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const title = String(row[config.titleField] ?? "Untitled");
            const status = row.status as string | undefined;

            return (
              <tr key={row.id} className="group transition-colors hover:bg-[var(--a-hover)]">
                {config.hasOrder ? (
                  <Td className="w-14">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => move(row.id, -1)}
                        disabled={pending}
                        aria-label="Move up"
                        className="grid size-5 place-items-center rounded text-[var(--a-subtle)] hover:bg-[var(--a-active)] hover:text-[var(--a-fg)] disabled:opacity-40"
                      >
                        <ArrowUp className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(row.id, 1)}
                        disabled={pending}
                        aria-label="Move down"
                        className="grid size-5 place-items-center rounded text-[var(--a-subtle)] hover:bg-[var(--a-active)] hover:text-[var(--a-fg)] disabled:opacity-40"
                      >
                        <ArrowDown className="size-3" />
                      </button>
                    </div>
                  </Td>
                ) : null}

                {config.listColumns.map((column, index) => (
                  <Td key={column.name} className={column.className}>
                    {index === 0 ? (
                      <Link
                        href={`/admin/${config.key}/${row.id}`}
                        className="font-medium text-[var(--a-fg-strong)] hover:underline"
                      >
                        {title}
                      </Link>
                    ) : (
                      renderCell(column.type, row[column.name])
                    )}
                    {index === 0 && row.isDemo ? (
                      <span className="ml-2 rounded border border-warning/40 px-1.5 py-0.5 text-[10px] font-medium uppercase text-warning">
                        demo
                      </span>
                    ) : null}
                  </Td>
                ))}

                <Td className="text-right">
                  <div className="relative flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/${config.key}/${row.id}`}
                      aria-label={`Edit ${title}`}
                      className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] transition-colors hover:bg-[var(--a-active)] hover:text-[var(--a-fg)]"
                    >
                      <Pencil className="size-3.5" />
                    </Link>

                    <button
                      type="button"
                      aria-label="More actions"
                      aria-expanded={menuOpen === row.id}
                      onClick={() => setMenuOpen(menuOpen === row.id ? null : row.id)}
                      className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] transition-colors hover:bg-[var(--a-active)] hover:text-[var(--a-fg)]"
                    >
                      {pending && menuOpen === row.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <MoreHorizontal className="size-3.5" />
                      )}
                    </button>

                    {menuOpen === row.id ? (
                      <>
                        <button
                          type="button"
                          aria-hidden="true"
                          tabIndex={-1}
                          className="fixed inset-0 z-20 cursor-default"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-[var(--a-border)] bg-[var(--a-elevated)] py-1 text-left shadow-[var(--a-shadow)]">
                          {config.hasStatus && canPublish ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(null);
                                run(() =>
                                  setStatusAction(
                                    config.key,
                                    row.id,
                                    status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                                  ),
                                );
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-[13px] text-[var(--a-fg)] hover:bg-[var(--a-hover)]"
                            >
                              {status === "PUBLISHED" ? (
                                <>
                                  <EyeOff className="size-3.5" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="size-3.5" />
                                  Publish
                                </>
                              )}
                            </button>
                          ) : null}

                          {config.hasFeatured ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(null);
                                run(() =>
                                  toggleFeaturedAction(config.key, row.id, !row.isFeatured),
                                );
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-[13px] text-[var(--a-fg)] hover:bg-[var(--a-hover)]"
                            >
                              <Star className="size-3.5" />
                              {row.isFeatured ? "Remove from featured" : "Mark as featured"}
                            </button>
                          ) : null}

                          {config.publicPath && row[config.slugField ?? "slug"] ? (
                            <Link
                              href={`${config.publicPath}/${row[config.slugField ?? "slug"]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setMenuOpen(null)}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-[13px] text-[var(--a-fg)] hover:bg-[var(--a-hover)]"
                            >
                              <Eye className="size-3.5" />
                              View on site
                            </Link>
                          ) : null}

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(null);
                                setPendingDelete(row);
                              }}
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-[13px] text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete "${String(pendingDelete?.[config.titleField] ?? "")}"?`}
        description="The entry is removed from the website immediately. A revision snapshot is kept so an administrator can restore it."
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target) run(() => deleteResourceAction(config.key, target.id));
        }}
      />

    </>
  );
}

function renderCell(type: string | undefined, value: unknown) {
  switch (type) {
    case "status":
      return value ? <StatusBadge status={String(value)} /> : null;
    case "boolean":
      return value ? (
        <Check className="size-4 text-success" aria-label="Yes" />
      ) : (
        <span className="text-[var(--a-subtle)]">—</span>
      );
    case "date":
      return (
        <span className="text-[var(--a-muted)]">
          {value ? formatDate(value as string) : "—"}
        </span>
      );
    case "number":
      return <span className="tabular-nums text-[var(--a-muted)]">{String(value ?? 0)}</span>;
    case "badge":
      return value ? (
        <span className="rounded-md border border-[var(--a-border)] px-2 py-0.5 text-[11.5px] text-[var(--a-muted)]">
          {String(value).replace(/_/g, " ").toLowerCase()}
        </span>
      ) : null;
    case "image":
      return value ? (
        <img src={String(value)} alt="" className="size-9 rounded-md object-cover" />
      ) : null;
    default:
      return (
        <span className={cn("text-[var(--a-muted)]")}>
          {value ? String(value) : <span className="text-[var(--a-subtle)]">—</span>}
        </span>
      );
  }
}
