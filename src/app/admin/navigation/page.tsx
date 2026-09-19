import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/ui";
import { NavigationManager } from "@/components/admin/navigation-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Navigation" };

export default async function NavigationPage() {
  const user = await requireUser();
  if (!can(user.role, "website.write")) notFound();

  const items = await prisma.navigationItem.findMany({
    orderBy: [{ order: "asc" }],
    select: {
      id: true,
      label: true,
      href: true,
      location: true,
      parentId: true,
      description: true,
      icon: true,
      badge: true,
      order: true,
      isVisible: true,
      openInNewTab: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Navigation"
        description="Header menu, mega-menu children and the footer link columns. Changes appear on the site immediately."
      />
      <NavigationManager items={items} />
    </div>
  );
}
