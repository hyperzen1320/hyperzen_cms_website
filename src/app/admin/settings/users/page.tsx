import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can, normaliseCapabilities, outranks } from "@/lib/rbac";
import { Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Staff accounts" };

export default async function AdminUsersPage() {
  const user = await requireUser();
  if (!can(user.role, "users.manage")) notFound();

  const [users, roles] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: [{ staffRole: { rank: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        staffRole: { select: { id: true, key: true, name: true, rank: true } },
      },
    }),
    prisma.staffRole.findMany({
      orderBy: { rank: "asc" },
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
    }),
  ]);

  // You can only put someone into a role below your own, so an admin can never
  // mint another global admin.
  const assignableRoles = roles
    .filter((role) => outranks(user.role, role.rank))
    .map((role) => ({ id: role.id, name: role.name, rank: role.rank }));

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Staff accounts"
        description="Who can sign in to the CMS, and which role each of them holds."
      >
        {can(user.role, "roles.manage") ? (
          <Link
            href="/admin/settings/roles"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3.5 text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
          >
            Manage roles
            <ArrowUpRight className="size-3.5" />
          </Link>
        ) : null}
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.slice(0, 6).map((role) => (
          <Card key={role.id}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13.5px] font-medium text-[var(--a-fg-strong)]">{role.name}</p>
              <span className="shrink-0 text-[11.5px] text-[var(--a-subtle)]">
                {role._count.users} {role._count.users === 1 ? "person" : "people"}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--a-muted)]">
              {role.description ??
                `${normaliseCapabilities(role.capabilities).length} permissions.`}
            </p>
          </Card>
        ))}
      </div>

      <Card padded={false}>
        <div className="p-5">
          <CardTitle title="Accounts" description={`${users.length} total`} />
        </div>
        <AdminUsersManager
          users={users.map((item) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            isActive: item.isActive,
            lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
            createdAt: item.createdAt.toISOString(),
            roleId: item.staffRole?.id ?? null,
            roleName: item.staffRole?.name ?? "No role",
            roleRank: item.staffRole?.rank ?? 999,
            isGlobalAdmin: item.staffRole?.key === "GLOBAL_ADMIN",
          }))}
          roles={assignableRoles}
          currentUserId={user.id}
          currentUserRank={user.role.rank}
        />
      </Card>
    </div>
  );
}
