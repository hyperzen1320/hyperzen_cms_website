// A Prisma config file turns off the CLI's own .env loading, so load it here —
// otherwise DATABASE_URL is missing for db push, migrate and studio.
import "dotenv/config";

import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma configuration. The seed command lives here rather than in
 * package.json, which Prisma 7 will stop reading.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
