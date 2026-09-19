import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getResource } from "@/lib/admin/resources";
import { loadRelationOptions, toFormRecord } from "@/lib/admin/relations";
import { ResourceForm } from "@/components/admin/resource-form";
import { RevisionHistory } from "@/components/admin/revision-history";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ resource: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resource } = await params;
  const config = getResource(resource);
  return { title: config ? `Edit ${config.singular.toLowerCase()}` : "Edit" };
}

export default async function EditResourcePage({ params }: Props) {
  const { resource, id } = await params;
  const config = getResource(resource);
  if (!config) notFound();

  const user = await requireUser();
  if (!can(user.role, config.capability)) notFound();

  const delegate = (prisma as any)[config.model];

  const [record, relationOptions, revisions] = await Promise.all([
    delegate.findUnique({
      where: { id },
      ...(config.model === "project"
        ? { include: { services: { select: { id: true } } } }
        : config.model === "blogPost"
          ? { include: { tags: { select: { name: true } } } }
          : {}),
    }),
    loadRelationOptions(config),
    prisma.contentRevision.findMany({
      where: { entityType: config.key, entityId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { author: { select: { name: true } } },
    }),
  ]);

  if (!record) notFound();


  // Publishing belongs to the global admin, so the status control is removed
  // server-side rather than merely hidden.
  const canPublish = can(user.role, "content.publish");
  const visibleConfig = canPublish
    ? config
    : { ...config, fields: config.fields.filter((field) => field.name !== "status") };

  return (
    <div>
      <ResourceForm
        config={visibleConfig}
        record={toFormRecord(config, record)}
        relationOptions={relationOptions}
        canDelete={can(user.role, "content.delete")}
        canPublish={canPublish}
      />

      <RevisionHistory
        revisions={revisions.map((revision) => ({
          id: revision.id,
          label: revision.label,
          createdAt: revision.createdAt.toISOString(),
          authorName: revision.author?.name ?? null,
        }))}
        canRestore={can(user.role, "content.write")}
      />
    </div>
  );
}
