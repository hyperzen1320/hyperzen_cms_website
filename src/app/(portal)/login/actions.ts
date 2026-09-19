"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  clientIpFrom,
  createSession,
  destroySession,
  hashPassword,
  purgeExpiredSessions,
  verifyPassword,
} from "@/lib/auth";
import {
  createPortalSession,
  destroyPortalSession,
  purgeExpiredPortalSessions,
} from "@/lib/portal-auth";
import { portalSignInSchema, portalSignUpSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";
import { safeRedirect } from "@/lib/utils";
import type { ActionResult } from "@/types";

/** A hash to compare against when no account exists, so timing stays even. */
const DUMMY_HASH = "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";

function readFormData(
  previous: ActionResult | null | FormData,
  maybeFormData?: FormData,
): FormData | null {
  if (maybeFormData instanceof FormData) return maybeFormData;
  if (previous instanceof FormData) return previous;
  return null;
}

/**
 * One sign-in for both audiences.
 *
 * The email decides the destination: a CMS staff account opens the admin, an
 * ERP account opens the portal. Nobody has to know which door they belong to,
 * and a failed attempt never reveals which of the two an address belongs to.
 */
export async function portalSignInAction(
  previous: ActionResult | null | FormData,
  maybeFormData?: FormData,
): Promise<ActionResult> {
  const formData = readFormData(previous, maybeFormData);
  if (!formData) return { ok: false, message: "Could not read the form. Please try again." };

  const headerList = await headers();
  const ip = clientIpFrom(headerList) ?? "unknown";
  const limit = rateLimit(`signin:${ip}`, 8, 10 * 60_000);
  if (!limit.success) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = portalSignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address and your password." };
  }

  const { password, next } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const invalid = { ok: false as const, message: "Those credentials do not match an account." };

  // Staff accounts take precedence when an address exists on both sides.
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (admin) {
    if (!admin.isActive) return invalid;
    if (!(await verifyPassword(password, admin.passwordHash))) return invalid;

    await purgeExpiredSessions();
    await createSession(admin.id);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    redirect(safeRedirect(next, "/admin"));
  }

  const customer = await prisma.erpUser.findUnique({ where: { email } });

  if (!customer) {
    await verifyPassword(password, DUMMY_HASH);
    return invalid;
  }

  if (!(await verifyPassword(password, customer.passwordHash))) return invalid;

  if (customer.status === "SUSPENDED") {
    return {
      ok: false,
      message: "This account has been suspended. Please contact your account manager.",
    };
  }
  if (customer.status === "PENDING") {
    return {
      ok: false,
      message: "This account is awaiting approval. We will email you once it is active.",
    };
  }

  await purgeExpiredPortalSessions();
  await createPortalSession(customer.id);
  await prisma.erpUser.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date() },
  });

  redirect(safeRedirect(next, "/erp"));
}

/**
 * Self-registration for ERP customers. CMS staff accounts are never created
 * this way — an administrator adds those in the CMS.
 */
export async function portalSignUpAction(
  previous: ActionResult | null | FormData,
  maybeFormData?: FormData,
): Promise<ActionResult> {
  const formData = readFormData(previous, maybeFormData);
  if (!formData) return { ok: false, message: "Could not read the form. Please try again." };

  const headerList = await headers();
  const ip = clientIpFrom(headerList) ?? "unknown";
  const limit = rateLimit(`signup:${ip}`, 5, 30 * 60_000);
  if (!limit.success) {
    return { ok: false, message: "Too many sign-up attempts. Please try again later." };
  }

  const parsed = portalSignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    company_website: formData.get("company_website"),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, message: "Please check the highlighted fields.", errors };
  }

  const data = parsed.data;

  // Honeypot: accept silently so a bot learns nothing.
  if (data.company_website) return { ok: true, message: "Account created." };

  const email = data.email.toLowerCase();

  const [existingAdmin, existingCustomer] = await Promise.all([
    prisma.adminUser.findUnique({ where: { email }, select: { id: true } }),
    prisma.erpUser.findUnique({ where: { email }, select: { id: true } }),
  ]);

  if (existingAdmin || existingCustomer) {
    return {
      ok: false,
      message: "An account already exists for that email. Try signing in instead.",
      errors: { email: "Already registered" },
    };
  }

  const customer = await prisma.erpUser.create({
    data: {
      email,
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      passwordHash: await hashPassword(data.password),
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  await notify({
    kind: "PORTAL",
    level: "SUCCESS",
    title: `New portal account — ${customer.name}`,
    body: [customer.company, customer.email].filter(Boolean).join(" · "),
    href: "/admin",
    entityType: "erpUser",
    entityId: customer.id,
    attributeToCurrentUser: false,
  });

  await createPortalSession(customer.id);
  redirect("/erp");
}

export async function portalSignOutAction(): Promise<void> {
  await destroyPortalSession();
  redirect("/login");
}

/** Signs the visitor out of whichever portal they are in. */
export async function signOutEverywhereAction(): Promise<void> {
  await Promise.all([destroySession(), destroyPortalSession()]);
  redirect("/login");
}
