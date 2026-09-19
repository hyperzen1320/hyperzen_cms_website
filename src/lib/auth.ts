import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { normaliseCapabilities, type ActorRole } from "@/lib/rbac";
import type { AdminUser } from "@prisma/client";

export const SESSION_COOKIE = "hz_session";
const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 12;

/**
 * The signed-in staff member.
 *
 * `role` is the full role record rather than a bare key, so every permission
 * check stays a synchronous array lookup instead of another database round trip.
 */
export type SessionUser = Pick<AdminUser, "id" | "email" | "name" | "avatarUrl" | "isActive"> & {
  role: ActorRole;
};

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}


export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const headerList = await headers();

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: headerList.get("user-agent")?.slice(0, 400) ?? null,
      ip: clientIpFrom(headerList),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Resolve the signed-in admin for the current request.
 * Memoised per request so repeated calls in a render tree hit the DB once.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
          staffRole: {
            select: { id: true, key: true, name: true, rank: true, capabilities: true },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;

  const { staffRole, ...user } = session.user;

  // An account without a role can sign in but can do nothing until an admin
  // assigns one — safer than falling back to a default set of permissions.
  return {
    ...user,
    role: {
      id: staffRole?.id ?? "",
      key: staffRole?.key ?? "NONE",
      name: staffRole?.name ?? "No role assigned",
      rank: staffRole?.rank ?? 999,
      capabilities: normaliseCapabilities(staffRole?.capabilities),
    },
  };
});

export async function requireUser(redirectTo = "/login?next=/admin"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}


export async function purgeExpiredSessions(): Promise<void> {
  await prisma.session
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

export function clientIpFrom(headerList: Headers): string | null {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim().slice(0, 64);
  return headerList.get("x-real-ip")?.slice(0, 64) ?? null;
}

/**
 * Reject cross-site writes. Server Actions already carry Next's built-in origin
 * check; this guards the JSON API routes that accept public POSTs.
 */
export async function assertSameOrigin(): Promise<boolean> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (!origin) return true; // non-browser client (curl, server-to-server)
  const host = headerList.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
