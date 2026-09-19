import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getResource } from "@/lib/admin/resources";
import { loadRelationOptions } from "@/lib/admin/relations";
import { ResourceForm } from "@/components/admin/resource-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ resource: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resource } = await params;
  const config = getResource(resource);
  return { title: config ? `New ${config.singular.toLowerCase()}` : "New" };
}

export default async function NewResourcePage({ params }: Props) {
  const { resource } = await params;
  const config = getResource(resource);
  if (!config) notFound();

  const user = await requireUser();
  if (!can(user.role, "content.write")) notFound();

  const relationOptions = await loadRelationOptions(config);


  // Publishing belongs to the global admin, so the status control is removed
  // server-side rather than merely hidden.
  const canPublish = can(user.role, "content.publish");
  const visibleConfig = canPublish
    ? config
    : { ...config, fields: config.fields.filter((field) => field.name !== "status") };

  return (
    <ResourceForm
      config={visibleConfig}
      record={null}
      relationOptions={relationOptions}
      canDelete={false}
      canPublish={canPublish}
    />
  );
}
