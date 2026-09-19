import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * A single Prisma client for the whole server process.
 *
 * The instance is cached on `globalThis` in every environment, not just in
 * development: Next.js splits the server build into several chunks, and without
 * this a route handler and a server action can each construct their own client
 * and open their own pool — which exhausts small connection limits (pooled
 * Postgres, or the embedded development database) for no benefit.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;

export * from "@prisma/client";
