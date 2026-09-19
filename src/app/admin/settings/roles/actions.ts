"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  can,
  GLOBAL_ADMIN_KEY,
  grantableCapabilities,
  isGlobalAdmin,
  normaliseCapabilities,
  outranks,
} from "@/lib/rbac";
import { notify } from "@/lib/notifications";
import { slugify } from "@/lib/utils";
import type { ActionResult } from "@/types";

/**
 * Creating and editing roles.
 *
 * Two invariants hold throughout, and both are enforced here rather than in the
 * interface, because the interface is only a convenience:
 *
 *   1. Nobody can grant a capability they do not hold themselves.
 *   2. Nobody can create, edit, delete or assign a role senior to their own.
 */
async function guard() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: "Your session has expired." };
  if (!can(user.role, "roles.manage")) {
    return { user: null, error: "Only the global admin and admins can manage roles." };
  }
  return { user, error: null };
}

/** Turn a name into a stable, readable key: "Digital marketing" → DIGITAL_MARKETING. */
function roleKeyFrom(name: string): string {
  return slugify(name).replace(/-/g, "_").toUpperCase().slice(0, 40);
}

export async function saveRoleAction(
  id: string | null,
  payload: {
    name: string;
    description?: string;
    rank: number;
    capabilities: string[];
  },
): Promise<ActionResult<{ id: string }>> {
  const { user, error } = await guard();
  if (error || !user) return { ok: false, message: error ?? "Not permitted." };

  const name = payload.name?.trim();
  if (!name || name.length < 2) {
    return { ok: false, message: "Give the role a name.", errors: { name: "Required" } };
  }

  const requested = normaliseCapabilities(payload.capabilities);
  const allowed = new Set(grantableCapabilities(user.role));
  const refused = requested.filter((capability) => !allowed.has(capability));

  if (refused.length) {
    return {
      ok: false,
      message: `You cannot grant permissions you do not hold yourself: ${refused.join(", ")}.`,
      errors: { capabilities: "Contains permissions above your own" },
    };
  }

  // A role must sit below the person creating it, otherwise an admin could mint
  // a peer and sidestep every other check.
  const rank = Number.isFinite(payload.rank) ? Math.trunc(payload.rank) : 50;
  const floor = isGlobalAdmin(user.role) ? 1 : user.role.rank + 1;
  const safeRank = Math.min(999, Math.max(floor, rank));

  if (id) {
    const existing = await prisma.staffRole.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "That role no longer exists." };

    if (existing.key === GLOBAL_ADMIN_KEY && !isGlobalAdmin(user.role)) {
      return { ok: false, message: "Only the global admin can change that role." };
    }
    if (!outranks(user.role, existing.rank)) {
      return { ok: false, message: "You cannot edit a role at or above your own." };
    }

    // The global admin keeps every capability, always.
    const capabilities =
      existing.key === GLOBAL_ADMIN_KEY ? grantableCapabilities(user.role) : requested;

    const role = await prisma.staffRole.update({
      where: { id },
      data: {
        name,
        description: payload.description?.trim() || null,
        capabilities,
        ...(existing.key === GLOBAL_ADMIN_KEY ? {} : { rank: safeRank }),
      },
    });

    revalidatePath("/admin/settings/roles");
    revalidatePath("/admin/settings/users");

    await notify({
      kind: "ACCOUNT",
      level: "WARNING",
      title: `Role updated — ${role.name}`,
      body: `${capabilities.length} permissions`,
      href: "/admin/settings/roles",
      entityType: "staffRole",
      entityId: role.id,
    });

    return { ok: true, message: "Role saved.", data: { id: role.id } };
  }

  let key = roleKeyFrom(name);
  if (!key) return { ok: false, message: "That name cannot be turned into a role key." };

  // Keys are unique; add a numeric suffix rather than rejecting a sensible name.
  const taken = await prisma.staffRole.findUnique({ where: { key }, select: { id: true } });
  if (taken) {
    let suffix = 2;
    while (await prisma.staffRole.findUnique({ where: { key: `${key}_${suffix}` }, select: { id: true } })) {
      suffix += 1;
    }
    key = `${key}_${suffix}`;
  }

  const role = await prisma.staffRole.create({
    data: {
      key,
      name,
      description: payload.description?.trim() || null,
      capabilities: requested,
      rank: safeRank,
      isSystem: false,
    },
  });

  revalidatePath("/admin/settings/roles");
  revalidatePath("/admin/settings/users");

  await notify({
    kind: "ACCOUNT",
    level: "WARNING",
    title: `Role created — ${role.name}`,
    body: `${requested.length} permissions`,
    href: "/admin/settings/roles",
    entityType: "staffRole",
    entityId: role.id,
  });

  return { ok: true, message: "Role created.", data: { id: role.id } };
}

export async function deleteRoleAction(
  id: string,
  reassignToId?: string,
): Promise<ActionResult> {
  const { user, error } = await guard();
  if (error || !user) return { ok: false, message: error ?? "Not permitted." };

  const role = await prisma.staffRole.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return { ok: false, message: "That role no longer exists." };

  if (role.isSystem) {
    return {
      ok: false,
      message: "Built-in roles cannot be deleted. Edit its permissions instead.",
    };
  }
  if (!outranks(user.role, role.rank)) {
    return { ok: false, message: "You cannot delete a role at or above your own." };
  }

  // People holding the role have to land somewhere before it disappears.
  if (role._count.users > 0) {
    if (!reassignToId) {
      return {
        ok: false,
        message: `${role._count.users} ${role._count.users === 1 ? "person holds" : "people hold"} this role. Choose a replacement role first.`,
      };
    }

    const replacement = await prisma.staffRole.findUnique({ where: { id: reassignToId } });
    if (!replacement) return { ok: false, message: "Choose a valid replacement role." };
    if (!outranks(user.role, replacement.rank)) {
      return { ok: false, message: "You cannot move people into that role." };
    }

    await prisma.adminUser.updateMany({
      where: { roleId: id },
      data: { roleId: replacement.id },
    });
  }

  await prisma.staffRole.delete({ where: { id } });

  revalidatePath("/admin/settings/roles");
  revalidatePath("/admin/settings/users");

  await notify({
    kind: "ACCOUNT",
    level: "WARNING",
    title: `Role deleted — ${role.name}`,
    href: "/admin/settings/roles",
    entityType: "staffRole",
  });

  return { ok: true, message: "Role deleted." };
}
