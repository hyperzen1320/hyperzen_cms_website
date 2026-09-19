/**
 * Create or reset a CMS administrator.
 *
 *   npm run admin:create -- --email you@company.com --name "Your Name" \
 *                           --password "a-strong-password" --role SUPER_ADMIN
 *
 * With no flags it falls back to ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from
 * the environment. Running it for an existing email resets that account's
 * password and role rather than creating a duplicate.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { assertDatabaseReachable } from "./db-preflight";
import { GLOBAL_ADMIN_KEY } from "../src/lib/rbac";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline?.split("=").slice(1).join("=");
}

async function main() {
  if (!(await assertDatabaseReachable(prisma))) {
    process.exitCode = 1;
    return;
  }

  const email = (arg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = arg("name") ?? process.env.ADMIN_NAME ?? "Hyperzen Admin";
  const roleKey = (arg("role") ?? GLOBAL_ADMIN_KEY).toUpperCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("An email address is required: npm run admin:create -- --email you@company.com");
    process.exitCode = 1;
    return;
  }

  const role = await prisma.staffRole.findUnique({ where: { key: roleKey } });
  if (!role) {
    const available = await prisma.staffRole.findMany({ select: { key: true }, orderBy: { rank: "asc" } });
    console.error(`Unknown role "${roleKey}". Available: ${available.map((item) => item.key).join(", ")}`);
    console.error("Run `npm run roles:sync` first if the roles have not been created yet.");
    process.exitCode = 1;
    return;
  }

  // A generated password is safer than a weak default when none is supplied.
  const generated = randomBytes(9).toString("base64url");
  const password = arg("password") ?? process.env.ADMIN_PASSWORD ?? generated;

  if (password.length < 8) {
    console.error("Passwords must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.adminUser.findUnique({ where: { email } });

  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { name, roleId: role.id, passwordHash, isActive: true },
    create: { email, name, roleId: role.id, passwordHash },
  });

  // A password change should not leave old sessions signed in.
  if (existing) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
  }

  console.log(`\n  ${existing ? "Updated" : "Created"} admin account`);
  console.log(`    email    : ${user.email}`);
  console.log(`    role     : ${role.name}`);
  if (!arg("password") && !process.env.ADMIN_PASSWORD) {
    console.log(`    password : ${password}   <- generated, store it now`);
  }
  console.log(`\n  Sign in at /login\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
