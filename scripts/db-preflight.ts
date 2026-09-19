import type { PrismaClient } from "@prisma/client";

/**
 * Turn a connection failure into one clear line instead of a Prisma stack dump.
 *
 * The embedded development database serves one client at a time, so the most
 * common cause of a failed script is simply that `npm run dev` is holding the
 * connection.
 */
export async function assertDatabaseReachable(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    const url = process.env.DATABASE_URL ?? "";
    const isLocalDev = url.includes("127.0.0.1:5433") || url.includes("localhost:5433");

    console.error("\n  Could not reach the database.\n");

    if (!url) {
      console.error("  DATABASE_URL is not set. Copy .env.example to .env and fill it in.\n");
    } else if (isLocalDev) {
      console.error("  Using the embedded development database. Two things to check:\n");
      console.error("    1. Is it running?  Start it with:  npm run db:dev");
      console.error("    2. Is the app holding the connection? It serves one client at a time —");
      console.error("       stop `npm run dev`, run this command, then start the app again.\n");
    } else {
      console.error(`  Check that DATABASE_URL points at a reachable PostgreSQL server.\n`);
      console.error(`  Host: ${url.replace(/\/\/[^@]*@/, "//***@")}\n`);
    }

    if (process.env.DEBUG) console.error(error);
    return false;
  }
}
