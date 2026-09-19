import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { clientIpFrom } from "@/lib/auth";
import type { ErpUser } from "@prisma/client";

/**
 * Sessions for ERP portal accounts.
 *
 * Deliberately a separate cookie and table from the CMS session: a customer
 * signing in to the ERP must never end up holding a staff session, and either
 * side can be revoked without touching the other.
 */
export const PORTAL_COOKIE = "hz_portal";
const SESSION_DAYS = 30;

export type PortalUser = Pick<
  ErpUser,
  "id" | "email" | "name" | "company" | "role" | "status"
>;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPortalSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const headerList = await headers();

  await prisma.erpSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: headerList.get("user-agent")?.slice(0, 400) ?? null,
      ip: clientIpFrom(headerList),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE)?.value;
  if (token) {
    await prisma.erpSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  cookieStore.delete(PORTAL_COOKIE);
}

/** The signed-in ERP customer for this request, memoised per render. */
export const getPortalUser = cache(async (): Promise<PortalUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.erpSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: { id: true, email: true, name: true, company: true, role: true, status: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.status !== "ACTIVE") return null;
  return session.user;
});

export async function requirePortalUser(redirectTo = "/login?next=/erp"): Promise<PortalUser> {
  const user = await getPortalUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function purgeExpiredPortalSessions(): Promise<void> {
  await prisma.erpSession
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => undefined);
}
