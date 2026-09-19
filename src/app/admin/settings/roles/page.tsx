import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  CAPABILITIES,
  can,
  grantableCapabilities,
  isGlobalAdmin,
  normaliseCapabilities,
  outranks,
} from "@/lib/rbac";
import { Card, PageHeader } from "@/components/admin/ui";
import { RolesManager } from "@/components/admin/roles-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage() {
  const user = await requireUser();
  if (!can(user.role, "roles.manage")) notFound();

  const roles = await prisma.staffRole.findMany({
    orderBy: [{ rank: "asc" }, { name: "asc" }],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      rank: true,
      capabilities: true,
      isSystem: true,
      _count: { select: { users: true } },
    },
  });

  const grantable = grantableCapabilities(user.role);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Roles"
        description="What each kind of team member can do. Add a role for any function — developer, HR, finance, QA, marketing — and give it exactly the permissions it needs."
      />

      <Card className="mb-4">
        <p className="text-[13px] leading-relaxed text-[var(--a-muted)]">
          {isGlobalAdmin(user.role) ? (
            <>
              You are the <span className="text-[var(--a-fg)]">global admin</span>: you hold every
              permission and are the only person who can change the global admin role itself.
            </>
          ) : (
            <>
              You can create and edit roles below your own, and grant only the{" "}
              <span className="text-[var(--a-fg)]">{grantable.length}</span> permissions you hold
              yourself. Anything above that stays with the global admin.
            </>
          )}
        </p>
      </Card>

      <RolesManager
        roles={roles.map((role) => ({
          id: role.id,
          key: role.key,
          name: role.name,
          description: role.description,
          rank: role.rank,
          isSystem: role.isSystem,
          userCount: role._count.users,
          capabilities: normaliseCapabilities(role.capabilities),
          editable: outranks(user.role, role.rank) && (role.key !== "GLOBAL_ADMIN" || isGlobalAdmin(user.role)),
        }))}
        capabilities={CAPABILITIES}
        grantable={grantable}
        actorRank={user.role.rank}
        actorIsGlobalAdmin={isGlobalAdmin(user.role)}
      />
    </div>
  );
}
