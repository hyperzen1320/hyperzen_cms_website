import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/admin/ui";
import { PageBuilder } from "@/components/admin/page-builder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Homepage" };

export default async function HomepageBuilderPage() {
  const user = await requireUser();

  // The homepage is a normal CMS page with the reserved slug "home".
  let page = await prisma.page.findUnique({
    where: { slug: "home" },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!page) {
    page = await prisma.page.create({
      data: {
        slug: "home",
        title: "Home",
        status: "PUBLISHED",
        isSystem: true,
        publishedAt: new Date(),
      },
      include: { sections: true },
    });
  }

  return (
    <div>
      <PageHeader
        title="Homepage"
        description="Compose the homepage from blocks. Changes appear on the live site as soon as you save."
      >
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3.5 text-[13px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
        >
          Open site
          <ExternalLink className="size-3.5" />
        </Link>
      </PageHeader>

      <PageBuilder
        pageId={page.id}
        pageSlug="home"
        canDelete={can(user.role, "content.delete")}
        canPublish={can(user.role, "content.publish")}
        sections={page.sections.map((section) => ({
          id: section.id,
          blockType: section.blockType,
          name: section.name,
          content: section.content as Record<string, unknown>,
          settings: section.settings as Record<string, unknown>,
          order: section.order,
          isVisible: section.isVisible,
        }))}
      />
    </div>
  );
}
