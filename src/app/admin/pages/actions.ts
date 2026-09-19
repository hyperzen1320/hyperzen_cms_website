"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getBlock } from "@/lib/admin/blocks";
import { sanitizeRichText } from "@/lib/sanitize";
import { slugify } from "@/lib/utils";
import { notify } from "@/lib/notifications";
import type { ActionResult } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function guard() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: "Your session has expired." };
  if (!can(user.role, "content.write")) {
    return { user: null, error: "You do not have permission to edit pages." };
  }
  return { user, error: null };
}

function refresh(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/admin/pages");
  revalidatePath("/admin/homepage");
  if (slug && slug !== "home") revalidatePath(`/${slug}`);
}

/** Coerce a block's content payload using its field definitions. */
function normaliseContent(blockType: string, payload: Record<string, unknown>) {
  const definition = getBlock(blockType);
  if (!definition) return {};

  const content: Record<string, unknown> = {};

  for (const field of definition.fields) {
    if (!(field.name in payload)) continue;
    const raw = payload[field.name];

    switch (field.type) {
      case "number": {
        const value = Number(raw);
        content[field.name] = Number.isFinite(value) ? Math.trunc(value) : undefined;
        break;
      }
      case "switch":
        content[field.name] = Boolean(raw);
        break;
      case "list":
        content[field.name] = Array.isArray(raw)
          ? raw.map(String).map((item) => item.trim()).filter(Boolean)
          : String(raw ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);
        break;
      case "repeater":
        content[field.name] = Array.isArray(raw)
          ? (raw as Record<string, string>[]).filter((item) =>
              Object.values(item ?? {}).some((value) => String(value ?? "").trim()),
            )
          : [];
        break;
      case "richtext":
        content[field.name] = sanitizeRichText(String(raw ?? ""));
        break;
      default: {
        const value = String(raw ?? "").trim();
        if (value) content[field.name] = value;
      }
    }
  }

  return content;
}

export async function addSectionAction(
  pageId: string,
  blockType: string,
): Promise<ActionResult<{ id: string }>> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  const definition = getBlock(blockType);
  if (!definition) return { ok: false, message: "Unknown block type." };

  const last = await prisma.pageSection.findFirst({
    where: { pageId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const section = await prisma.pageSection.create({
    data: {
      pageId,
      blockType,
      name: definition.label,
      content: (definition.defaults ?? {}) as any,
      settings: {},
      order: (last?.order ?? -1) + 1,
    },
  });

  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { slug: true } });
  refresh(page?.slug);

  return { ok: true, message: `${definition.label} block added.`, data: { id: section.id } };
}

export async function updateSectionAction(
  sectionId: string,
  payload: { name?: string; content: Record<string, unknown>; settings: Record<string, unknown> },
): Promise<ActionResult> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  const section = await prisma.pageSection.findUnique({
    where: { id: sectionId },
    include: { page: { select: { slug: true } } },
  });
  if (!section) return { ok: false, message: "That section no longer exists." };

  await prisma.pageSection.update({
    where: { id: sectionId },
    data: {
      name: payload.name?.trim() || section.name,
      content: normaliseContent(section.blockType, payload.content) as any,
      settings: payload.settings as any,
    },
  });

  refresh(section.page.slug);
  return { ok: true, message: "Section saved." };
}

export async function toggleSectionAction(
  sectionId: string,
  isVisible: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };
  if (!can(user.role, "content.publish")) {
    return {
      ok: false,
      message: "Only the global admin can show or hide sections.",
    };
  }

  const section = await prisma.pageSection.update({
    where: { id: sectionId },
    data: { isVisible },
    include: { page: { select: { slug: true } } },
  });

  refresh(section.page.slug);

  await notify({
    kind: "PUBLISH",
    level: isVisible ? "SUCCESS" : "WARNING",
    title: `Section ${isVisible ? "shown" : "hidden"} — ${section.name ?? section.blockType}`,
    body: `On the ${section.page.slug === "home" ? "homepage" : `/${section.page.slug}`} page.`,
    href: section.page.slug === "home" ? "/admin/homepage" : `/admin/pages/${section.pageId}`,
    entityType: "pageSection",
    entityId: sectionId,
  });

  return { ok: true, message: isVisible ? "Section shown." : "Section hidden." };
}

export async function deleteSectionAction(sectionId: string): Promise<ActionResult> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  const section = await prisma.pageSection.findUnique({
    where: { id: sectionId },
    include: { page: { select: { slug: true } } },
  });
  if (!section) return { ok: false, message: "That section no longer exists." };

  await prisma.pageSection.delete({ where: { id: sectionId } });
  refresh(section.page.slug);
  return { ok: true, message: "Section removed." };
}

export async function reorderSectionsAction(
  pageId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.pageSection.update({ where: { id }, data: { order: index } }),
    ),
  );

  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { slug: true } });
  refresh(page?.slug);
  return { ok: true, message: "Order updated." };
}

export async function duplicateSectionAction(sectionId: string): Promise<ActionResult> {
  const { error } = await guard();
  if (error) return { ok: false, message: error };

  const section = await prisma.pageSection.findUnique({
    where: { id: sectionId },
    include: { page: { select: { slug: true } } },
  });
  if (!section) return { ok: false, message: "That section no longer exists." };

  await prisma.pageSection.updateMany({
    where: { pageId: section.pageId, order: { gt: section.order } },
    data: { order: { increment: 1 } },
  });

  await prisma.pageSection.create({
    data: {
      pageId: section.pageId,
      blockType: section.blockType,
      name: `${section.name ?? section.blockType} copy`,
      content: section.content as any,
      settings: section.settings as any,
      order: section.order + 1,
      isVisible: section.isVisible,
    },
  });

  refresh(section.page.slug);
  return { ok: true, message: "Section duplicated." };
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export async function savePageAction(
  id: string | null,
  payload: {
    title: string;
    slug: string;
    description?: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    seoTitle?: string;
    seoDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
  },
): Promise<ActionResult<{ id: string }>> {
  const { user, error } = await guard();
  if (error || !user) return { ok: false, message: error ?? "Not permitted." };
  const canPublish = can(user.role, "content.publish");

  const title = payload.title?.trim();
  const slug = slugify(payload.slug || payload.title || "");

  if (!title) return { ok: false, message: "A title is required.", errors: { title: "Required" } };
  if (!slug) return { ok: false, message: "A slug is required.", errors: { slug: "Required" } };

  const existing = await prisma.page.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== id) {
    return { ok: false, message: "That slug is already used by another page.", errors: { slug: "Taken" } };
  }

  const data = {
    title,
    slug,
    description: payload.description?.trim() || null,
    status: payload.status,
    seoTitle: payload.seoTitle?.trim() || null,
    seoDescription: payload.seoDescription?.trim() || null,
    ogImage: payload.ogImage?.trim() || null,
    canonicalUrl: payload.canonicalUrl?.trim() || null,
    noIndex: Boolean(payload.noIndex),
    ...(payload.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
  };

  const previous = id
    ? await prisma.page.findUnique({ where: { id }, select: { status: true } })
    : null;

  // Only the global admin decides whether a page is visible to visitors.
  if (data.status === "PUBLISHED" && previous?.status !== "PUBLISHED" && !canPublish) {
    data.status = "DRAFT";
  }

  const page = id
    ? await prisma.page.update({ where: { id }, data })
    : await prisma.page.create({ data });

  refresh(page.slug);

  const nowLive = page.status === "PUBLISHED" && previous?.status !== "PUBLISHED";
  const nowHidden = previous?.status === "PUBLISHED" && page.status !== "PUBLISHED";

  await notify({
    kind: nowLive || nowHidden ? "PUBLISH" : "CONTENT",
    level: nowLive ? "SUCCESS" : nowHidden ? "WARNING" : "INFO",
    title: nowLive
      ? `Page published — ${page.title}`
      : nowHidden
        ? `Page hidden — ${page.title}`
        : `Page ${id ? "updated" : "created"} — ${page.title}`,
    body: `/${page.slug === "home" ? "" : page.slug}`,
    href: page.slug === "home" ? "/admin/homepage" : `/admin/pages/${page.id}`,
    entityType: "page",
    entityId: page.id,
  });

  return {
    ok: true,
    message:
      data.status === "DRAFT" && payload.status === "PUBLISHED"
        ? "Page saved as a draft. Only the global admin can publish."
        : "Page saved.",
    data: { id: page.id },
  };
}

export async function deletePageAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };
  if (!can(user.role, "content.delete")) {
    return { ok: false, message: "Only admins can delete pages." };
  }

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return { ok: false, message: "That page no longer exists." };
  if (page.isSystem) {
    return {
      ok: false,
      message: "System pages cannot be deleted. Unpublish it instead if you need it hidden.",
    };
  }

  await prisma.page.delete({ where: { id } });
  refresh(page.slug);
  return { ok: true, message: "Page deleted." };
}
