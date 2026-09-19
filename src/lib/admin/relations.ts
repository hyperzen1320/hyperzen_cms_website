import "server-only";

import { prisma } from "@/lib/db";
import type { RelationSource, ResourceConfig } from "@/lib/admin/fields";
import { truncate } from "@/lib/utils";

export type RelationOption = { value: string; label: string };

/** Load the option lists a resource form needs for its relation pickers. */
export async function loadRelationOptions(
  config: ResourceConfig,
): Promise<Record<string, RelationOption[]>> {
  const sources = new Set<RelationSource>();
  for (const field of config.fields) {
    if (field.source) sources.add(field.source);
  }
  if (!sources.size) return {};

  const entries = await Promise.all(
    Array.from(sources).map(async (source): Promise<[string, RelationOption[]]> => {
      switch (source) {
        case "services": {
          const rows = await prisma.service.findMany({
            orderBy: { order: "asc" },
            select: { id: true, title: true },
          });
          return ["services", rows.map((row) => ({ value: row.id, label: row.title }))];
        }
        case "industries": {
          const rows = await prisma.industry.findMany({
            orderBy: { order: "asc" },
            select: { id: true, name: true },
          });
          return ["industries", rows.map((row) => ({ value: row.id, label: row.name }))];
        }
        case "testimonials": {
          const rows = await prisma.testimonial.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, clientName: true, company: true, quote: true },
          });
          return [
            "testimonials",
            rows.map((row) => ({
              value: row.id,
              label: `${row.clientName}${row.company ? ` — ${row.company}` : ""} · ${truncate(row.quote, 40)}`,
            })),
          ];
        }
        case "categories": {
          const rows = await prisma.category.findMany({
            orderBy: { order: "asc" },
            select: { id: true, name: true },
          });
          return ["categories", rows.map((row) => ({ value: row.id, label: row.name }))];
        }
        default:
          return [source, []];
      }
    }),
  );

  return Object.fromEntries(entries);
}

/** Flatten a record into the shape the form expects (relations become id arrays). */
export function toFormRecord(
  config: ResourceConfig,
  record: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!record) return null;
  const output: Record<string, unknown> = { ...record };

  if (Array.isArray(record.services)) {
    output.serviceIds = (record.services as { id: string }[]).map((item) => item.id);
  }
  if (Array.isArray(record.tags)) {
    output.tags = (record.tags as { name: string }[]).map((item) => item.name);
  }

  for (const field of config.fields) {
    if (field.type === "date" && record[field.name] instanceof Date) {
      output[field.name] = (record[field.name] as Date).toISOString();
    }
  }

  return output;
}
