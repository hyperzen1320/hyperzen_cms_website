/**
 * Move staff accounts onto data-driven roles.
 *
 *   npm run roles:sync
 *
 * Creates (or refreshes) the system roles and points every account at one. Safe
 * to run repeatedly: custom roles are never touched, and an account that already
 * has a role keeps it.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { assertDatabaseReachable } from "./db-preflight";
import { GLOBAL_ADMIN_KEY, SYSTEM_ROLES } from "../src/lib/rbac";

const prisma = new PrismaClient();

async function main() {
  if (!(await assertDatabaseReachable(prisma))) {
    process.exitCode = 1;
    return;
  }

  // 1. System roles. Capabilities are refreshed so a new capability added in a
  //    release reaches the built-in roles, but names people may have edited and
  //    any custom roles are left alone.
  for (const role of SYSTEM_ROLES) {
    await prisma.staffRole.upsert({
      where: { key: role.key },
      update: {
        capabilities: role.capabilities,
        isSystem: true,
        rank: role.rank,
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        capabilities: role.capabilities,
        isSystem: true,
        rank: role.rank,
      },
    });
  }

  const roles = await prisma.staffRole.findMany({ select: { id: true, key: true } });
  const byKey = new Map(roles.map((role) => [role.key, role.id]));

  // 2. Nobody should be left without a role. An account that somehow has none
  //    lands on Editor, the least privileged role that can still do useful work.
  const orphaned = await prisma.adminUser.updateMany({
    where: { roleId: null },
    data: { roleId: byKey.get("EDITOR") },
  });
  const moved = orphaned.count;

  // 3. There must always be a way back in.
  const globalAdmins = await prisma.adminUser.count({
    where: { isActive: true, staffRole: { key: GLOBAL_ADMIN_KEY } },
  });

  if (globalAdmins === 0) {
    const first = await prisma.adminUser.findFirst({ orderBy: { createdAt: "asc" } });
    if (first) {
      await prisma.adminUser.update({
        where: { id: first.id },
        data: { roleId: byKey.get(GLOBAL_ADMIN_KEY), isActive: true },
      });
      console.log(`  Promoted ${first.email} to global admin — no active one existed.`);
    }
  }

  console.log(`\n  Roles ready: ${roles.length} (${moved} account${moved === 1 ? "" : "s"} migrated)\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
