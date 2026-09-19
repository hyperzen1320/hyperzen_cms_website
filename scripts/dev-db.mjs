/**
 * Local development database.
 *
 * Spins up an embedded PostgreSQL (PGlite) instance and exposes it over the real
 * PostgreSQL wire protocol on 127.0.0.1:5433, so Prisma, psql and the Next.js app
 * can talk to it exactly like a normal Postgres server — no Docker, no install.
 *
 * This is a DEVELOPMENT CONVENIENCE ONLY. In production point DATABASE_URL at a
 * real PostgreSQL instance (Supabase, Neon, RDS, self-hosted, ...).
 *
 *   npm run db:dev        # keep this running in its own terminal
 *   npm run db:push       # in another terminal
 *   npm run db:seed
 *   npm run dev
 *
 * PGlite is a single database instance, so exactly one client is served at a
 * time; the rest queue and are served in order as each client disconnects. Every
 * connection gets its own handler — a handler holds an exclusive lock on the
 * database for as long as it is attached, and sharing one across connections
 * loses the release for the previous client, which wedges the server for good.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const PORT = Number(process.env.DEV_DB_PORT || 5433);
const HOST = process.env.DEV_DB_HOST || "127.0.0.1";
const DATA_DIR = resolve(process.cwd(), process.env.DEV_DB_DIR || ".pgdata");

// A client that has to wait longer than this gets a clean connection error
// instead of hanging — a stuck migration is much easier to diagnose that way.
const QUEUE_TIMEOUT = Number(process.env.DEV_DB_QUEUE_TIMEOUT || 15_000);

mkdirSync(DATA_DIR, { recursive: true });

console.log("┌────────────────────────────────────────────────────────────┐");
console.log("│  Hyperzen — embedded PostgreSQL (development only)          │");
console.log("└────────────────────────────────────────────────────────────┘");
console.log(`  data directory : ${DATA_DIR}`);

const db = await PGlite.create({ dataDir: DATA_DIR });
await db.waitReady;

const server = new PGLiteSocketServer({
  db,
  port: PORT,
  host: HOST,
  connectionQueueTimeout: QUEUE_TIMEOUT,
  debug: process.env.DEV_DB_DEBUG === "1",
});

server.addEventListener("error", (event) => {
  const error = event.detail;
  if (["ECONNRESET", "EPIPE"].includes(error?.code)) return;
  if (error?.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use — is another db:dev running?\n`);
    process.exit(1);
  }
  console.warn(`  [db] ${error?.message ?? error}`);
});

server.addEventListener("queueTimeout", () => {
  console.warn(
    `  [db] a client waited ${QUEUE_TIMEOUT / 1000}s for the database and gave up.` +
      " Something else is still holding the connection.",
  );
});

// A client that disappears mid-query surfaces as a socket-level error. Keep the
// database running rather than taking the whole session down.
process.on("uncaughtException", (error) => {
  if (["ECONNRESET", "EPIPE", "ERR_STREAM_WRITE_AFTER_END"].includes(error?.code)) {
    console.warn(`  [db] client disconnected (${error.code}) — continuing.`);
    return;
  }
  throw error;
});

try {
  await server.start();
} catch (error) {
  if (error?.code === "EADDRINUSE") {
    console.error(`\n  Port ${PORT} is already in use — is another db:dev running?\n`);
    process.exit(1);
  }
  throw error;
}

console.log(`  listening on   : postgresql://${HOST}:${PORT}`);
console.log(
  `  DATABASE_URL   : postgresql://postgres:postgres@${HOST}:${PORT}/postgres?sslmode=disable&connection_limit=1&pgbouncer=true`,
);
console.log("\n  Press Ctrl+C to stop.\n");

let stopping = false;
const shutdown = async (signal) => {
  if (stopping) return;
  stopping = true;
  console.log(`\n${signal} received — shutting the database down...`);
  try {
    await server.stop();
    await db.close();
  } catch (error) {
    console.error(error);
  }
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
