"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { can, GLOBAL_ADMIN_KEY, outranks, type Capability } from "@/lib/rbac";
import { verifySmtp } from "@/lib/email";
import { revalidateContent } from "@/lib/cache";
import { notify } from "@/lib/notifications";
import type { ActionResult, SocialLink } from "@/types";
import type { NavLocation } from "@prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function guard(capability: Capability) {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: "Your session has expired." };
  if (!can(user.role, capability)) return { user: null, error: "You do not have permission." };
  return { user, error: null };
}

// ---------------------------------------------------------------------------
// Site settings (general, branding, footer, social)
// ---------------------------------------------------------------------------

const SETTINGS_STRING_FIELDS = [
  "companyName",
  "legalName",
  "tagline",
  "description",
  "logoUrl",
  "logoDarkUrl",
  "faviconUrl",
  "email",
  "phone",
  "address",
  "addressLocality",
  "addressRegion",
  "addressCountry",
  "postalCode",
  "mapUrl",
  "footerDescription",
  "footerCtaTitle",
  "footerCtaText",
  "footerCtaLabel",
  "footerCtaUrl",
  "newsletterTitle",
  "newsletterText",
  "copyright",
  "primaryCtaLabel",
  "primaryCtaUrl",
  "accentColor",
  "accentColor2",
  "analyticsProvider",
  "analyticsId",
] as const;

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export async function saveSiteSettingsAction(
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const { error } = await guard("settings.write");
  if (error) return { ok: false, message: error };

  const data: Record<string, unknown> = {};

  for (const field of SETTINGS_STRING_FIELDS) {
    if (!(field in payload)) continue;
    const value = String(payload[field] ?? "").trim();
    data[field] = value || null;
  }

  // Required, non-nullable columns need a value even when the field is cleared.
  for (const field of ["companyName", "legalName", "tagline", "description", "email", "copyright", "primaryCtaLabel", "primaryCtaUrl"]) {
    if (field in data && !data[field]) data[field] = "";
  }

  for (const field of ["accentColor", "accentColor2"] as const) {
    if (field in data && data[field] && !HEX.test(String(data[field]))) {
      return {
        ok: false,
        message: "Colours must be hex values such as #3FC8E4.",
        errors: { [field]: "Use a hex colour like #3FC8E4" },
      };
    }
  }

  if ("socialLinks" in payload) {
    const links = Array.isArray(payload.socialLinks) ? (payload.socialLinks as SocialLink[]) : [];
    data.socialLinks = links
      .filter((link) => link?.label && link?.url)
      .map((link) => ({
        label: String(link.label).slice(0, 60),
        url: String(link.url).slice(0, 300),
        icon: String(link.icon ?? link.label).toLowerCase().slice(0, 40),
      }));
  }

  if ("announcementText" in payload || "announcementEnabled" in payload) {
    data.announcement = {
      enabled: Boolean(payload.announcementEnabled),
      text: String(payload.announcementText ?? "").trim(),
      url: String(payload.announcementUrl ?? "").trim(),
    };
  }

  if ("maintenanceMode" in payload) data.maintenanceMode = Boolean(payload.maintenanceMode);

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data as any,
    create: { id: "singleton", ...(data as any) },
  });

  revalidateContent("settings");
  revalidatePath("/admin/settings");

  await notify({
    kind: "SETTINGS",
    title: "Site settings updated",
    body: Object.keys(data).slice(0, 5).join(", "),
    href: "/admin/settings",
    entityType: "siteSettings",
  });

  return { ok: true, message: "Settings saved." };
}

// ---------------------------------------------------------------------------
// SEO settings
// ---------------------------------------------------------------------------

export async function saveSeoSettingsAction(
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const { error } = await guard("website.write");
  if (error) return { ok: false, message: error };

  const text = (key: string) => {
    const value = String(payload[key] ?? "").trim();
    return value || null;
  };

  await prisma.sEOSettings.upsert({
    where: { id: "singleton" },
    update: {
      siteTitle: text("siteTitle") ?? "Hyperzen Innovation",
      titleTemplate: text("titleTemplate") ?? "%s — Hyperzen Innovation",
      metaDescription: text("metaDescription") ?? "",
      keywords: text("keywords"),
      ogImage: text("ogImage"),
      twitterHandle: text("twitterHandle"),
      twitterCardType: text("twitterCardType") ?? "summary_large_image",
      robotsIndex: Boolean(payload.robotsIndex),
      robotsFollow: Boolean(payload.robotsFollow),
      googleVerification: text("googleVerification"),
      bingVerification: text("bingVerification"),
    },
    create: {
      id: "singleton",
      siteTitle: text("siteTitle") ?? "Hyperzen Innovation",
      titleTemplate: text("titleTemplate") ?? "%s — Hyperzen Innovation",
      metaDescription: text("metaDescription") ?? "",
    },
  });

  revalidateContent("seo");
  revalidatePath("/admin/seo");

  await notify({
    kind: "SETTINGS",
    title: "SEO settings updated",
    href: "/admin/seo",
    entityType: "seoSettings",
  });

  return { ok: true, message: "SEO settings saved." };
}

// ---------------------------------------------------------------------------
// Email settings
// ---------------------------------------------------------------------------

export async function saveEmailSettingsAction(
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const { error } = await guard("settings.write");
  if (error) return { ok: false, message: error };

  const text = (key: string) => {
    const value = String(payload[key] ?? "").trim();
    return value || null;
  };

  const port = Number(payload.smtpPort);
  const existing = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });

  // An empty password field means "keep the stored one" rather than "clear it".
  const password = String(payload.smtpPassword ?? "").trim();

  const data = {
    smtpHost: text("smtpHost"),
    smtpPort: Number.isFinite(port) && port > 0 ? Math.trunc(port) : 587,
    smtpUser: text("smtpUser"),
    smtpPassword: password ? password : (existing?.smtpPassword ?? null),
    smtpSecure: Boolean(payload.smtpSecure),
    fromEmail: text("fromEmail"),
    fromName: text("fromName"),
    notificationEmail: text("notificationEmail"),
    replyTo: text("replyTo"),
    enabled: Boolean(payload.enabled),
  };

  await prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  revalidatePath("/admin/settings/email");

  await notify({
    kind: "SETTINGS",
    title: `Email delivery ${data.enabled ? "enabled" : "disabled"}`,
    body: data.smtpHost ? `Host: ${data.smtpHost}` : null,
    href: "/admin/settings/email",
    entityType: "emailSettings",
  });

  return { ok: true, message: "Email settings saved." };
}

export async function testSmtpAction(): Promise<ActionResult> {
  const { error } = await guard("settings.write");
  if (error) return { ok: false, message: error };

  const result = await verifySmtp();
  return result.ok
    ? { ok: true, message: result.message }
    : { ok: false, message: result.message };
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export async function saveNavItemAction(
  id: string | null,
  payload: {
    label: string;
    href: string;
    location: NavLocation;
    parentId?: string | null;
    description?: string;
    icon?: string;
    badge?: string;
    isVisible?: boolean;
    openInNewTab?: boolean;
  },
): Promise<ActionResult<{ id: string }>> {
  const { error } = await guard("website.write");
  if (error) return { ok: false, message: error };

  const label = payload.label?.trim();
  const href = payload.href?.trim();
  if (!label || !href) {
    return {
      ok: false,
      message: "Label and link are both required.",
      errors: { label: label ? "" : "Required", href: href ? "" : "Required" },
    };
  }

  const data = {
    label,
    href,
    location: payload.location,
    parentId: payload.parentId || null,
    description: payload.description?.trim() || null,
    icon: payload.icon?.trim() || null,
    badge: payload.badge?.trim() || null,
    isVisible: payload.isVisible ?? true,
    openInNewTab: payload.openInNewTab ?? false,
  };

  let item;
  if (id) {
    item = await prisma.navigationItem.update({ where: { id }, data });
  } else {
    const last = await prisma.navigationItem.findFirst({
      where: { location: payload.location, parentId: payload.parentId || null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    item = await prisma.navigationItem.create({
      data: { ...data, order: (last?.order ?? -1) + 1 },
    });
  }

  revalidateContent("navigation");
  revalidatePath("/admin/navigation");

  await notify({
    kind: "CONTENT",
    title: `Navigation link ${id ? "updated" : "added"} — ${item.label}`,
    body: `${item.href} · ${item.location.replace(/_/g, " ").toLowerCase()}`,
    href: "/admin/navigation",
    entityType: "navigationItem",
    entityId: item.id,
  });

  return { ok: true, message: "Navigation saved.", data: { id: item.id } };
}

export async function deleteNavItemAction(id: string): Promise<ActionResult> {
  const { error } = await guard("website.write");
  if (error) return { ok: false, message: error };

  await prisma.navigationItem.delete({ where: { id } });
  revalidateContent("navigation");
  revalidatePath("/admin/navigation");
  return { ok: true, message: "Link removed." };
}

export async function reorderNavAction(orderedIds: string[]): Promise<ActionResult> {
  const { error } = await guard("website.write");
  if (error) return { ok: false, message: error };

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.navigationItem.update({ where: { id }, data: { order: index } }),
    ),
  );

  revalidateContent("navigation");
  revalidatePath("/admin/navigation");
  return { ok: true, message: "Order updated." };
}

// ---------------------------------------------------------------------------
// Admin users
// ---------------------------------------------------------------------------

export async function saveAdminUserAction(
  id: string | null,
  payload: { name: string; email: string; roleId: string; password?: string; isActive?: boolean },
): Promise<ActionResult> {
  const { user, error } = await guard("users.manage");
  if (error || !user) return { ok: false, message: error ?? "Not permitted." };

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, message: "Name and email are required." };
  }
  if (!id && (!payload.password || payload.password.length < 8)) {
    return {
      ok: false,
      message: "Set a password of at least 8 characters.",
      errors: { password: "At least 8 characters" },
    };
  }

  const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== id) {
    return { ok: false, message: "That email already belongs to another account." };
  }

  const role = await prisma.staffRole.findUnique({ where: { id: payload.roleId } });
  if (!role) return { ok: false, message: "Choose a role for this account." };

  // You may only place someone in a role below your own, so an admin can never
  // create a peer or a global admin.
  if (!outranks(user.role, role.rank)) {
    return { ok: false, message: `You cannot assign the ${role.name} role.` };
  }

  if (id) {
    const target = await prisma.adminUser.findUnique({
      where: { id },
      include: { staffRole: { select: { key: true, rank: true } } },
    });
    if (!target) return { ok: false, message: "That account no longer exists." };

    // The same rule applies to who you may edit at all.
    if (user.id !== id && !outranks(user.role, target.staffRole?.rank ?? 999)) {
      return { ok: false, message: "You cannot edit an account at or above your own role." };
    }

    // There must always be a way back in.
    const losingGlobalAdmin =
      target.staffRole?.key === GLOBAL_ADMIN_KEY &&
      (role.key !== GLOBAL_ADMIN_KEY || payload.isActive === false);

    if (losingGlobalAdmin) {
      const remaining = await prisma.adminUser.count({
        where: { isActive: true, staffRole: { key: GLOBAL_ADMIN_KEY }, id: { not: id } },
      });
      if (remaining === 0) {
        return { ok: false, message: "There must always be one active global admin." };
      }
    }
  }

  const data: Record<string, unknown> = {
    name,
    email,
    roleId: role.id,
    isActive: payload.isActive ?? true,
  };
  if (payload.password) {
    if (payload.password.length < 8) {
      return { ok: false, message: "Passwords must be at least 8 characters." };
    }
    data.passwordHash = await hashPassword(payload.password);
  }

  if (id) {
    await prisma.adminUser.update({ where: { id }, data: data as any });
  } else {
    await prisma.adminUser.create({ data: data as any });
  }

  revalidatePath("/admin/settings/users");

  await notify({
    kind: "ACCOUNT",
    level: "WARNING",
    title: `Admin user ${id ? "updated" : "created"} — ${name}`,
    body: `Role: ${role.name}`,
    href: "/admin/settings/users",
    entityType: "adminUser",
    entityId: id ?? undefined,
  });

  return { ok: true, message: id ? "User updated." : "User created." };
}

export async function deleteAdminUserAction(id: string): Promise<ActionResult> {
  const { user, error } = await guard("users.manage");
  if (error || !user) return { ok: false, message: error ?? "Not permitted." };
  if (user.id === id) return { ok: false, message: "You cannot delete your own account." };

  const target = await prisma.adminUser.findUnique({
    where: { id },
    include: { staffRole: { select: { key: true, rank: true } } },
  });
  if (!target) return { ok: false, message: "That user no longer exists." };

  if (!outranks(user.role, target.staffRole?.rank ?? 999)) {
    return { ok: false, message: "You cannot delete an account at or above your own role." };
  }

  if (target.staffRole?.key === GLOBAL_ADMIN_KEY) {
    const remaining = await prisma.adminUser.count({
      where: { isActive: true, staffRole: { key: GLOBAL_ADMIN_KEY }, id: { not: id } },
    });
    if (remaining === 0) {
      return { ok: false, message: "There must always be one active global admin." };
    }
  }

  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/settings/users");

  await notify({
    kind: "ACCOUNT",
    level: "WARNING",
    title: `Admin user removed — ${target.name}`,
    href: "/admin/settings/users",
    entityType: "adminUser",
  });

  return { ok: true, message: "User deleted." };
}

export async function updateOwnProfileAction(payload: {
  name: string;
  email: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  if (!name || !email) return { ok: false, message: "Name and email are required." };

  const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== user.id) {
    return { ok: false, message: "That email is already in use." };
  }

  await prisma.adminUser.update({ where: { id: user.id }, data: { name, email } });
  revalidatePath("/admin/account");
  return { ok: true, message: "Profile updated." };
}

export async function changeOwnPasswordAction(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  if (!payload.newPassword || payload.newPassword.length < 8) {
    return {
      ok: false,
      message: "New passwords must be at least 8 characters.",
      errors: { newPassword: "At least 8 characters" },
    };
  }

  const record = await prisma.adminUser.findUnique({ where: { id: user.id } });
  if (!record) return { ok: false, message: "Account not found." };

  const valid = await verifyPassword(payload.currentPassword, record.passwordHash);
  if (!valid) {
    return {
      ok: false,
      message: "That current password is not correct.",
      errors: { currentPassword: "Incorrect password" },
    };
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(payload.newPassword) },
  });

  // Signing out other sessions after a password change is the safe default.
  await prisma.session.deleteMany({ where: { userId: user.id } });

  return { ok: true, message: "Password changed. Please sign in again." };
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export async function deleteSubscriberAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "marketing.write")) {
    return { ok: false, message: "You do not have permission." };
  }

  await prisma.newsletterSubscriber.delete({ where: { id } });
  revalidatePath("/admin/newsletter");
  return { ok: true, message: "Subscriber removed." };
}

export async function toggleSubscriberAction(
  id: string,
  isSubscribed: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "marketing.write")) {
    return { ok: false, message: "You do not have permission." };
  }

  await prisma.newsletterSubscriber.update({ where: { id }, data: { isSubscribed } });
  revalidatePath("/admin/newsletter");
  return { ok: true, message: isSubscribed ? "Resubscribed." : "Unsubscribed." };
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export async function updateMediaAction(
  id: string,
  payload: { alt?: string; title?: string },
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "media.write")) {
    return { ok: false, message: "You do not have permission." };
  }

  await prisma.media.update({
    where: { id },
    data: {
      alt: payload.alt?.trim() || null,
      title: payload.title?.trim() || null,
    },
  });

  revalidatePath("/admin/media");
  return { ok: true, message: "Media updated." };
}

export async function deleteMediaAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "media.delete")) {
    return { ok: false, message: "Only admins can delete media." };
  }

  const { deleteMedia } = await import("@/lib/storage");
  await deleteMedia(id);

  revalidatePath("/admin/media");
  return { ok: true, message: "File deleted." };
}

