import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CAPABILITIES } from "@/lib/rbac";
import { Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { AccountPanel } from "@/components/admin/account-panel";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();

  const [record, sessionCount] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, lastLoginAt: true, createdAt: true },
    }),
    prisma.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader title="My account" description="Your profile and password." />

      <Card className="mb-4">
        <CardTitle title="Access" />
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Role", user.role.name],
            [
              "Permissions",
              user.role.key === "GLOBAL_ADMIN"
                ? "Everything — this role can never be restricted."
                : `${user.role.capabilities.length} of ${CAPABILITIES.length} permissions`,
            ],
            ["Last sign-in", record?.lastLoginAt ? formatDateTime(record.lastLoginAt) : "—"],
            ["Active sessions", String(sessionCount)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[12px] text-[var(--a-subtle)]">{label}</dt>
              <dd className="mt-0.5 text-[13.5px] text-[var(--a-fg)]">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <AccountPanel name={record?.name ?? user.name} email={record?.email ?? user.email} />
    </div>
  );
}
