"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Table, Td, Th } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { deleteAdminUserAction, saveAdminUserAction } from "@/app/admin/settings/actions";
import { cn, formatDate, initials, relativeTime } from "@/lib/utils";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roleId: string | null;
  roleName: string;
  roleRank: number;
  isGlobalAdmin: boolean;
};

type RoleOption = { id: string; name: string; rank: number };

export function AdminUsersManager({
  users,
  roles,
  currentUserId,
  currentUserRank,
}: {
  users: AdminUserRow[];
  roles: RoleOption[];
  currentUserId: string;
  currentUserRank: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminUserRow | null | "new">(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);

  /** You may only act on someone below your own rank — never a peer or senior. */
  const canManage = (row: AdminUserRow) =>
    currentUserRank === 0 || row.roleRank > currentUserRank;

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

  return (
    <>
      <div className="border-t border-[var(--a-border)]">
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last sign-in</Th>
              <Th className="w-24 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const manageable = canManage(user);
              return (
                <tr key={user.id} className="transition-colors hover:bg-[var(--a-hover)]">
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-[11.5px] font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                      >
                        {initials(user.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-[var(--a-fg-strong)]">
                          {user.name}
                          {user.id === currentUserId ? (
                            <span className="ml-2 text-[11.5px] font-normal text-[var(--a-subtle)]">
                              you
                            </span>
                          ) : null}
                        </span>
                        <span className="block truncate text-[12px] text-[var(--a-subtle)]">
                          {user.email}
                        </span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={user.isGlobalAdmin ? "accent" : "neutral"}>{user.roleName}</Badge>
                  </Td>
                  <Td>
                    {user.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="danger">Disabled</Badge>
                    )}
                  </Td>
                  <Td className="text-[var(--a-muted)]">
                    {user.lastLoginAt ? relativeTime(user.lastLoginAt) : "Never"}
                    <span className="mt-0.5 block text-[11.5px] text-[var(--a-subtle)]">
                      Added {formatDate(user.createdAt)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {manageable || user.id === currentUserId ? (
                        <button
                          type="button"
                          onClick={() => setEditing(user)}
                          aria-label={`Edit ${user.name}`}
                          className="grid size-8 place-items-center rounded-lg text-[var(--a-muted)] transition-colors hover:bg-[var(--a-active)] hover:text-[var(--a-fg)]"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      ) : (
                        <span
                          title="This account holds a role at or above your own"
                          className="grid size-8 place-items-center text-[var(--a-subtle)]"
                        >
                          <Lock className="size-3.5" />
                        </span>
                      )}
                      {manageable && user.id !== currentUserId ? (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(user)}
                          aria-label={`Delete ${user.name}`}
                          className="grid size-8 place-items-center rounded-lg text-danger transition-colors hover:bg-danger/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      <div className="p-5">
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={roles.length === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <Plus className="size-4" />
          Add user
        </button>
        {roles.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-[var(--a-muted)]">
            There is no role below your own to assign yet.
          </p>
        ) : null}
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
              className="admin w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-panel)] shadow-[var(--a-shadow)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--a-border)] px-5 py-3.5">
                <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">
                  {editing === "new" ? "Add staff account" : "Edit account"}
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

              <UserForm
                user={editing === "new" ? null : editing}
                roles={roles}
                isSelf={editing !== "new" && editing.id === currentUserId}
                pending={pending}
                onSubmit={(values) =>
                  run(() =>
                    saveAdminUserAction(editing === "new" ? null : editing.id, {
                      name: values.name,
                      email: values.email,
                      roleId: values.roleId,
                      password: values.password || undefined,
                      isActive: values.isActive,
                    }),
                  )
                }
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? ""}?`}
        description="They lose access immediately. Content they created stays in place."
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target) run(() => deleteAdminUserAction(target.id));
        }}
      />
    </>
  );
}

function UserForm({
  user,
  roles,
  isSelf,
  pending,
  onSubmit,
}: {
  user: AdminUserRow | null;
  roles: RoleOption[];
  isSelf: boolean;
  pending: boolean;
  onSubmit: (values: {
    name: string;
    email: string;
    roleId: string;
    password: string;
    isActive: boolean;
  }) => void;
}) {
  const [values, setValues] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    roleId: user?.roleId ?? roles[roles.length - 1]?.id ?? "",
    password: "",
    isActive: user?.isActive ?? true,
  });

  // Editing yourself must not offer a way to change your own role or lock
  // yourself out — that has to come from someone more senior.
  const roleLocked = isSelf;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
      className="space-y-4 p-5"
    >
      <label className="block">
        <span className="a-label">Name</span>
        <input
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          required
          className="a-input"
        />
      </label>

      <label className="block">
        <span className="a-label">Email</span>
        <input
          type="email"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          required
          className="a-input"
        />
      </label>

      <label className="block">
        <span className="a-label">Role</span>
        <select
          value={values.roleId}
          disabled={roleLocked}
          onChange={(event) =>
            setValues((current) => ({ ...current, roleId: event.target.value }))
          }
          className="a-input"
        >
          {roleLocked && user ? <option value={values.roleId}>{user.roleName}</option> : null}
          {!roleLocked
            ? roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))
            : null}
        </select>
        {roleLocked ? (
          <span className="mt-1.5 block text-[12px] text-[var(--a-subtle)]">
            You cannot change your own role.
          </span>
        ) : null}
      </label>

      <label className="block">
        <span className="a-label">{user ? "New password" : "Password"}</span>
        <input
          type="password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
          placeholder={user ? "Leave blank to keep the current password" : "At least 8 characters"}
          className="a-input"
          autoComplete="new-password"
        />
      </label>

      <label className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={values.isActive}
          disabled={isSelf}
          onClick={() => setValues((current) => ({ ...current, isActive: !current.isActive }))}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
            values.isActive ? "border-transparent" : "border-[var(--a-border)] bg-[var(--a-input)]",
          )}
          style={
            values.isActive
              ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }
              : undefined
          }
        >
          <span
            className={cn(
              "inline-block size-4 rounded-full bg-white transition-transform",
              values.isActive ? "translate-x-[22px]" : "translate-x-[3px]",
            )}
          />
        </button>
        <span className="text-[13.5px] text-[var(--a-fg)]">
          Account is active{isSelf ? " — you cannot deactivate yourself" : ""}
        </span>
      </label>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {user ? "Save user" : "Create user"}
        </button>
      </div>
    </form>
  );
}
