"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Lock, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Card } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteRoleAction, saveRoleAction } from "@/app/admin/settings/roles/actions";
import { cn } from "@/lib/utils";
import type { Capability, CapabilityGroup } from "@/lib/rbac";

type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  rank: number;
  isSystem: boolean;
  userCount: number;
  capabilities: Capability[];
  editable: boolean;
};

type CapabilityMeta = {
  key: Capability;
  label: string;
  description: string;
  group: CapabilityGroup;
};

export function RolesManager({
  roles,
  capabilities,
  grantable,
  actorRank,
  actorIsGlobalAdmin,
}: {
  roles: RoleRow[];
  capabilities: CapabilityMeta[];
  grantable: Capability[];
  actorRank: number;
  actorIsGlobalAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<RoleRow | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RoleRow | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const run = (action: () => Promise<{ ok: boolean; message?: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Saved.");
        setEditing(null);
        router.refresh();
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });

  const replacementOptions = roles.filter(
    (role) => role.id !== pendingDelete?.id && (actorIsGlobalAdmin || role.rank > actorRank),
  );

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <Plus className="size-4" />
          New role
        </button>
      </div>

      <ul className="space-y-3">
        {roles.map((role) => (
          <li key={role.id}>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">
                      {role.name}
                    </h2>
                    {role.key === "GLOBAL_ADMIN" ? (
                      <Badge tone="accent">
                        <Shield className="mr-1 inline size-3" />
                        Full access
                      </Badge>
                    ) : null}
                    {role.isSystem ? <Badge>Built-in</Badge> : <Badge tone="success">Custom</Badge>}
                    <span className="text-[12px] text-[var(--a-subtle)]">
                      {role.userCount} {role.userCount === 1 ? "person" : "people"}
                    </span>
                  </div>
                  {role.description ? (
                    <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--a-muted)]">
                      {role.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {role.editable ? (
                    <button
                      type="button"
                      onClick={() => setEditing(role)}
                      aria-label={`Edit ${role.name}`}
                      className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] transition-colors hover:bg-[var(--a-active)] hover:text-[var(--a-fg)]"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  ) : (
                    <span
                      title="This role is at or above your own"
                      className="grid size-8 place-items-center text-[var(--a-subtle)]"
                    >
                      <Lock className="size-3.5" />
                    </span>
                  )}
                  {role.editable && !role.isSystem ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReassignTo("");
                        setPendingDelete(role);
                      }}
                      aria-label={`Delete ${role.name}`}
                      className="grid size-8 place-items-center rounded-lg text-danger transition-colors hover:bg-danger/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-1.5">
                {role.key === "GLOBAL_ADMIN" ? (
                  <li className="rounded-md border border-[color-mix(in_oklab,var(--accent)_40%,transparent)] px-2 py-0.5 text-[11.5px] text-[var(--accent)]">
                    Every permission, always
                  </li>
                ) : role.capabilities.length ? (
                  capabilities
                    .filter((capability) => role.capabilities.includes(capability.key))
                    .map((capability) => (
                      <li
                        key={capability.key}
                        className="rounded-md border border-[var(--a-border)] px-2 py-0.5 text-[11.5px] text-[var(--a-muted)]"
                      >
                        {capability.label}
                      </li>
                    ))
                ) : (
                  <li className="text-[12.5px] text-[var(--a-subtle)]">
                    No permissions — this role can sign in but do nothing.
                  </li>
                )}
              </ul>
            </Card>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {editing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="admin my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-panel)] shadow-[var(--a-shadow)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--a-border)] px-5 py-3.5">
                <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">
                  {editing === "new" ? "New role" : `Edit ${editing.name}`}
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

              <RoleForm
                role={editing === "new" ? null : editing}
                capabilities={capabilities}
                grantable={grantable}
                actorRank={actorRank}
                actorIsGlobalAdmin={actorIsGlobalAdmin}
                pending={pending}
                onSubmit={(values) =>
                  run(() =>
                    saveRoleAction(editing === "new" ? null : editing.id, values),
                  )
                }
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete the ${pendingDelete?.name ?? ""} role?`}
        description={
          pendingDelete?.userCount
            ? `${pendingDelete.userCount} ${pendingDelete.userCount === 1 ? "person holds" : "people hold"} this role. Pick the role they should move to below.`
            : "The role is removed. Nobody currently holds it."
        }
        confirmLabel="Delete role"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          if (!target) return;
          if (target.userCount > 0 && !reassignTo) {
            toast.error("Choose a role for the people who hold this one.");
            return;
          }
          setPendingDelete(null);
          run(() => deleteRoleAction(target.id, reassignTo || undefined));
        }}
      >
        {pendingDelete && pendingDelete.userCount > 0 ? (
          <label className="mt-4 block">
            <span className="a-label">Move them to</span>
            <select
              value={reassignTo}
              onChange={(event) => setReassignTo(event.target.value)}
              className="a-input"
            >
              <option value="">Select a role…</option>
              {replacementOptions.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function RoleForm({
  role,
  capabilities,
  grantable,
  actorRank,
  actorIsGlobalAdmin,
  pending,
  onSubmit,
}: {
  role: RoleRow | null;
  capabilities: CapabilityMeta[];
  grantable: Capability[];
  actorRank: number;
  actorIsGlobalAdmin: boolean;
  pending: boolean;
  onSubmit: (values: {
    name: string;
    description: string;
    rank: number;
    capabilities: string[];
  }) => void;
}) {
  const isGlobalAdminRole = role?.key === "GLOBAL_ADMIN";
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [rank, setRank] = useState(role?.rank ?? Math.max(50, actorRank + 10));
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(role?.capabilities ?? []),
  );

  const grantableSet = new Set(grantable);
  const groups = Array.from(new Set(capabilities.map((item) => item.group)));

  const toggle = (key: Capability) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name,
          description,
          rank,
          capabilities: Array.from(selected),
        });
      }}
      className="max-h-[70vh] space-y-5 overflow-y-auto p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="a-label">Role name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Developer, HR, Finance…"
            required
            className="a-input"
          />
        </label>

        <label className="block">
          <span className="a-label">Seniority</span>
          <input
            type="number"
            value={rank}
            min={actorIsGlobalAdmin ? 1 : actorRank + 1}
            max={999}
            disabled={isGlobalAdminRole}
            onChange={(event) => setRank(Number(event.target.value))}
            className="a-input"
          />
          <span className="mt-1.5 block text-[12px] text-[var(--a-subtle)]">
            Lower is more senior. A role can only manage roles ranked below it.
          </span>
        </label>
      </div>

      <label className="block">
        <span className="a-label">Description</span>
        <textarea
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What this role is responsible for."
          className="a-input h-auto resize-y py-2.5"
        />
      </label>

      <div>
        <span className="a-label">Permissions</span>
        {isGlobalAdminRole ? (
          <p className="rounded-lg border border-[color-mix(in_oklab,var(--accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-4 py-3 text-[13px] text-[var(--a-fg)]">
            The global admin always holds every permission. That cannot be narrowed — it is what
            guarantees there is always a way back into the system.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--a-subtle)]">
                  {group}
                </p>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {capabilities
                    .filter((capability) => capability.group === group)
                    .map((capability) => {
                      const allowed = grantableSet.has(capability.key);
                      const checked = selected.has(capability.key);
                      return (
                        <li key={capability.key}>
                          <button
                            type="button"
                            disabled={!allowed}
                            onClick={() => toggle(capability.key)}
                            className={cn(
                              "flex w-full items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                              checked
                                ? "border-[color-mix(in_oklab,var(--accent)_50%,transparent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]"
                                : "border-[var(--a-border)] hover:border-[var(--a-border-strong)]",
                              !allowed && "cursor-not-allowed opacity-45",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 grid size-4 shrink-0 place-items-center rounded border",
                                checked
                                  ? "border-transparent bg-[var(--accent)] text-white"
                                  : "border-[var(--a-border-strong)]",
                              )}
                            >
                              {checked ? <Check className="size-3" /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-medium text-[var(--a-fg-strong)]">
                                {capability.label}
                              </span>
                              <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--a-muted)]">
                                {allowed
                                  ? capability.description
                                  : "You do not hold this permission, so you cannot grant it."}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {role ? "Save role" : "Create role"}
        </button>
      </div>
    </form>
  );
}
