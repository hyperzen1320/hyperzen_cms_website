"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getResource } from "@/lib/admin/resources";
import type { Field, ResourceConfig } from "@/lib/admin/fields";
import { revalidateContent } from "@/lib/cache";
import { describeChanges, notify } from "@/lib/notifications";
import { readingTime, slugify } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";
import type { ActionResult } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Payload = Record<string, unknown>;

/** Prisma delegate for a resource, resolved from its model name. */
function delegate(config: ResourceConfig) {
  return (prisma as any)[config.model];
}

const REVALIDATE_KEY: Record<string, string> = {
  services: "service",
  solutions: "solution",
  industries: "industry",
  products: "product",
  projects: "project",
  testimonials: "testimonial",
  insights: "post",
  categories: "post",
  careers: "job",
  faqs: "faq",
};

// ---------------------------------------------------------------------------
// Value coercion
// ---------------------------------------------------------------------------

function coerce(field: Field, raw: unknown): unknown {
  switch (field.type) {
    case "number": {
      if (raw === "" || raw === null || raw === undefined) return null;
      const value = Number(raw);
      return Number.isFinite(value) ? Math.trunc(value) : null;
    }
    case "switch":
      return raw === true || raw === "true" || raw === "on";
    case "date": {
      if (!raw) return null;
      const date = new Date(String(raw));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    case "list": {
      if (Array.isArray(raw)) return raw.filter((item) => String(item).trim().length > 0);
      return String(raw ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    case "repeater": {
      if (!Array.isArray(raw)) return [];
      return (raw as Record<string, string>[]).filter((item) =>
        Object.values(item ?? {}).some((value) => String(value ?? "").trim().length > 0),
      );
    }
    case "richtext":
      return sanitizeRichText(String(raw ?? ""));
    case "slug":
      return slugify(String(raw ?? ""));
    case "multirelation":
      return Array.isArray(raw) ? raw.map(String).filter(Boolean) : [];
    case "relation":
      return raw ? String(raw) : null;
    case "tags":
      return String(raw ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    default: {
      const value = String(raw ?? "").trim();
      return value.length ? value : null;
    }
  }
}

function validate(config: ResourceConfig, data: Payload): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of config.fields) {
    const value = data[field.name];
    if (!field.required) continue;

    if (field.type === "slug") {
      if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value))) {
        errors[field.name] = "Use lowercase letters, numbers and hyphens.";
      }
      continue;
    }
    if (value === null || value === undefined || String(value).trim() === "") {
      errors[field.name] = `${field.label} is required.`;
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Save (create or update)
// ---------------------------------------------------------------------------

export async function saveResourceAction(
  resourceKey: string,
  id: string | null,
  payload: Payload,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired. Sign in again." };

  const config = getResource(resourceKey);
  if (!config) return { ok: false, message: "Unknown content type." };
  if (!can(user.role, "content.write")) {
    return { ok: false, message: "You do not have permission to edit content." };
  }

  // Build the record from the field definitions only — nothing from the client
  // payload reaches the database unless the resource declares it.
  const data: Payload = {};
  const relationIds: Record<string, string[]> = {};
  let tags: string[] = [];

  for (const field of config.fields) {
    if (!(field.name in payload)) continue;
    const value = coerce(field, payload[field.name]);

    if (field.type === "multirelation") {
      relationIds[field.name] = value as string[];
      continue;
    }
    if (field.type === "tags") {
      tags = value as string[];
      continue;
    }
    data[field.name] = value;
  }

  // Auto-slug from the title when the slug was left blank.
  if (config.slugField && !data[config.slugField]) {
    const source = String(payload[config.titleField] ?? "");
    if (source) data[config.slugField] = slugify(source);
  }

  const errors = validate(config, data);
  if (Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  // Slug uniqueness
  if (config.slugField && data[config.slugField]) {
    const existing = await delegate(config).findFirst({
      where: { [config.slugField]: data[config.slugField] as string },
      select: { id: true },
    });
    if (existing && existing.id !== id) {
      return {
        ok: false,
        message: "That slug is already in use.",
        errors: { [config.slugField]: "This slug is taken by another entry." },
      };
    }
  }

  // Publishing timestamps
  if (config.hasStatus) {
    const status = data.status ?? "DRAFT";
    if (status === "PUBLISHED" && !data.publishedAt) {
      const current = id
        ? await delegate(config).findUnique({ where: { id }, select: { publishedAt: true } })
        : null;
      data.publishedAt = current?.publishedAt ?? new Date();
    }
  }

  if (config.model === "blogPost") {
    data.readingMinutes = readingTime(String(data.content ?? ""));
    if (!data.authorName) data.authorName = user.name;
    if (!id) data.authorId = user.id;
  }

  let publishBlocked = false;

  // Publishing is the global admin's call: anyone else saves as a draft.
  if (config.hasStatus && data.status === "PUBLISHED" && !can(user.role, "content.publish")) {
    const current = id
      ? await delegate(config).findUnique({ where: { id }, select: { status: true } })
      : null;

    if (current?.status !== "PUBLISHED") {
      data.status = "DRAFT";
      publishBlocked = true;
    }
  }

  try {
    let record: { id: string };
    let previousRecord: Record<string, unknown> | null = null;

    if (id) {
      const previous = await delegate(config).findUnique({ where: { id } });
      if (!previous) return { ok: false, message: "That entry no longer exists." };
      previousRecord = previous as Record<string, unknown>;

      // Snapshot before overwriting so the change can be rolled back.
      await prisma.contentRevision.create({
        data: {
          entityType: config.key,
          entityId: id,
          data: JSON.parse(JSON.stringify(previous)),
          label: "Auto-saved before update",
          authorId: user.id,
        },
      });

      record = await delegate(config).update({
        where: { id },
        data: {
          ...data,
          ...(config.relations?.some((relation) => relation.many)
            ? buildRelationUpdates(config, relationIds)
            : {}),
          ...(tags.length || config.model === "blogPost" ? await buildTags(tags) : {}),
        },
      });
    } else {
      record = await delegate(config).create({
        data: {
          ...data,
          ...(config.relations?.some((relation) => relation.many)
            ? buildRelationUpdates(config, relationIds, true)
            : {}),
          ...(tags.length ? await buildTags(tags) : {}),
        },
      });
    }

    revalidateContent(REVALIDATE_KEY[config.key] ?? "page", data[config.slugField ?? ""] as string);
    revalidatePath(`/admin/${config.key}`);
    if (config.publicPath) revalidatePath(config.publicPath);

    const title = String(data[config.titleField] ?? config.singular);
    const wasPublished = previousRecord?.status === "PUBLISHED";
    const nowPublished = data.status === "PUBLISHED";

    await notify({
      kind: nowPublished && !wasPublished ? "PUBLISH" : "CONTENT",
      level: nowPublished && !wasPublished ? "SUCCESS" : "INFO",
      title: id
        ? `${config.singular} updated — ${title}`
        : `${config.singular} created — ${title}`,
      body:
        describeChanges(
          previousRecord,
          data,
          config.fields.map((field) => field.name),
        ) ?? (nowPublished ? "Now live on the website." : "Saved as a draft."),
      href: `/admin/${config.key}/${record.id}`,
      entityType: config.key,
      entityId: record.id,
    });

    return {
      ok: true,
      message: publishBlocked
        ? `${config.singular} saved as a draft. Only the global admin can publish.`
        : `${config.singular} saved.`,
      data: { id: record.id },
    };
  } catch (error) {
    console.error(`[admin] failed to save ${config.key}:`, error);
    return { ok: false, message: "Could not save. Please check the values and try again." };
  }
}

function buildRelationUpdates(
  config: ResourceConfig,
  relationIds: Record<string, string[]>,
  isCreate = false,
): Payload {
  const updates: Payload = {};
  for (const relation of config.relations ?? []) {
    if (!relation.many) continue;
    const ids = relationIds[relation.field];
    if (!ids) continue;
    const target = relation.field === "serviceIds" ? "services" : relation.field;
    updates[target] = isCreate
      ? { connect: ids.map((id) => ({ id })) }
      : { set: ids.map((id) => ({ id })) };
  }
  return updates;
}

/** Create any missing tags and return a Prisma connect payload. */
async function buildTags(names: string[]): Promise<Payload> {
  if (!names.length) return { tags: { set: [] } };

  const records = await Promise.all(
    names.map((name) =>
      prisma.tag.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );

  return { tags: { set: records.map((tag) => ({ id: tag.id })) } };
}

// ---------------------------------------------------------------------------
// Delete / status / reorder
// ---------------------------------------------------------------------------

export async function deleteResourceAction(
  resourceKey: string,
  id: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const config = getResource(resourceKey);
  if (!config) return { ok: false, message: "Unknown content type." };
  if (!can(user.role, "content.delete")) {
    return { ok: false, message: "Only admins can delete content." };
  }

  try {
    const record = await delegate(config).findUnique({ where: { id } });
    if (!record) return { ok: false, message: "That entry no longer exists." };

    await prisma.contentRevision.create({
      data: {
        entityType: config.key,
        entityId: id,
        data: JSON.parse(JSON.stringify(record)),
        label: "Deleted",
        authorId: user.id,
      },
    });

    await delegate(config).delete({ where: { id } });

    revalidateContent(REVALIDATE_KEY[config.key] ?? "page");
    revalidatePath(`/admin/${config.key}`);

    await notify({
      kind: "CONTENT",
      level: "WARNING",
      title: `${config.singular} deleted — ${String((record as Record<string, unknown>)[config.titleField] ?? "Untitled")}`,
      body: "Recoverable from Recently deleted on the list screen.",
      href: `/admin/${config.key}`,
      entityType: config.key,
      entityId: id,
    });

    return { ok: true, message: `${config.singular} deleted.` };
  } catch (error) {
    console.error(`[admin] failed to delete ${config.key}:`, error);
    return { ok: false, message: "Could not delete this entry." };
  }
}

export async function setStatusAction(
  resourceKey: string,
  id: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const config = getResource(resourceKey);
  if (!config?.hasStatus) return { ok: false, message: "Unknown content type." };
  if (!can(user.role, "content.publish")) {
    return { ok: false, message: "You do not have permission to publish." };
  }

  await delegate(config).update({
    where: { id },
    data: {
      status,
      ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });

  revalidateContent(REVALIDATE_KEY[config.key] ?? "page");
  revalidatePath(`/admin/${config.key}`);

  const entry = await delegate(config).findUnique({ where: { id } });
  await notify({
    kind: "PUBLISH",
    level: status === "PUBLISHED" ? "SUCCESS" : "WARNING",
    title: `${config.singular} ${status === "PUBLISHED" ? "published" : status.toLowerCase()} — ${String(entry?.[config.titleField] ?? "")}`,
    body:
      status === "PUBLISHED"
        ? "Now visible on the website."
        : "No longer visible to visitors.",
    href: `/admin/${config.key}/${id}`,
    entityType: config.key,
    entityId: id,
  });

  return { ok: true, message: status === "PUBLISHED" ? "Published." : "Status updated." };
}

export async function toggleFeaturedAction(
  resourceKey: string,
  id: string,
  isFeatured: boolean,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const config = getResource(resourceKey);
  if (!config?.hasFeatured) return { ok: false, message: "Unknown content type." };
  if (!can(user.role, "content.write")) {
    return { ok: false, message: "You do not have permission to edit content." };
  }

  await delegate(config).update({ where: { id }, data: { isFeatured } });
  revalidateContent(REVALIDATE_KEY[config.key] ?? "page");
  revalidatePath(`/admin/${config.key}`);
  return { ok: true, message: isFeatured ? "Marked as featured." : "Removed from featured." };
}

export async function reorderResourceAction(
  resourceKey: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const config = getResource(resourceKey);
  if (!config?.hasOrder) return { ok: false, message: "This content type is not sortable." };
  if (!can(user.role, "content.write")) {
    return { ok: false, message: "You do not have permission to edit content." };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      delegate(config).update({ where: { id }, data: { order: index } }),
    ),
  );

  revalidateContent(REVALIDATE_KEY[config.key] ?? "page");
  revalidatePath(`/admin/${config.key}`);
  return { ok: true, message: "Order updated." };
}

// ---------------------------------------------------------------------------
// Revisions
// ---------------------------------------------------------------------------

export async function restoreRevisionAction(revisionId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };
  if (!can(user.role, "content.write")) {
    return { ok: false, message: "You do not have permission to restore content." };
  }

  const revision = await prisma.contentRevision.findUnique({ where: { id: revisionId } });
  if (!revision) return { ok: false, message: "That revision no longer exists." };

  const config = getResource(revision.entityType);
  if (!config) return { ok: false, message: "Unknown content type." };

  const snapshot = revision.data as Payload;
  const data: Payload = {};

  for (const field of config.fields) {
    if (field.name in snapshot) data[field.name] = snapshot[field.name];
  }
  if (config.slugField && snapshot[config.slugField]) {
    data[config.slugField] = snapshot[config.slugField];
  }

  try {
    // A snapshot taken before a delete has no row left to update, so restoring
    // it has to re-create the entry — with its original id, so anything that
    // referenced it (a project's industry, a post's category) still resolves.
    const existing = await delegate(config).findUnique({
      where: { id: revision.entityId },
      select: { id: true },
    });

    if (existing) {
      await delegate(config).update({ where: { id: revision.entityId }, data });
    } else {
      await delegate(config).create({
        data: {
          ...data,
          id: revision.entityId,
          ...(config.hasStatus ? { status: snapshot.status ?? "DRAFT" } : {}),
        },
      });
    }

    revalidateContent(REVALIDATE_KEY[config.key] ?? "page");
    revalidatePath(`/admin/${config.key}`);
    revalidatePath(`/admin/${config.key}/${revision.entityId}`);
    return {
      ok: true,
      message: existing ? "Revision restored." : `${config.singular} restored.`,
    };
  } catch (error) {
    console.error("[admin] failed to restore revision:", error);
    return { ok: false, message: "Could not restore this revision." };
  }
}

/**
 * Deleted entries keep their last snapshot, so they can be brought back from
 * the list screen without hunting through an entry that no longer exists.
 */
export async function listDeletedAction(
  resourceKey: string,
): Promise<ActionResult<{ id: string; label: string; deletedAt: string }[]>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session has expired." };

  const config = getResource(resourceKey);
  if (!config) return { ok: false, message: "Unknown content type." };

  const revisions = await prisma.contentRevision.findMany({
    where: { entityType: config.key, label: "Deleted" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const stillMissing: { id: string; label: string; deletedAt: string }[] = [];
  for (const revision of revisions) {
    const exists = await delegate(config).findUnique({
      where: { id: revision.entityId },
      select: { id: true },
    });
    if (exists) continue;
    const snapshot = revision.data as Payload;
    stillMissing.push({
      id: revision.id,
      label: String(snapshot[config.titleField] ?? "Untitled"),
      deletedAt: revision.createdAt.toISOString(),
    });
  }

  return { ok: true, data: stillMissing };
}
