import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageBuilder } from "@/components/admin/page-builder";
import { PageSettingsForm } from "@/components/admin/page-settings-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit page" };

type Props = { params: Promise<{ id: string }> };

export default async function EditPagePage({ params }: Props) {
  const user = await requireUser();
  if (!can(user.role, "content.write")) notFound();

  const { id } = await params;
  const page = await prisma.page.findUnique({
    where: { id },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!page) notFound();

  return (
    <div>
      <Link
        href="/admin/pages"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--a-muted)] transition-colors hover:text-[var(--a-fg)]"
      >
        <ArrowLeft className="size-3.5" />
        All pages
      </Link>

      <h1 className="mb-6 text-[22px] font-semibold tracking-tight text-[var(--a-fg-strong)]">
        {page.title}
      </h1>

      <div className="mb-6">
        <PageSettingsForm
          page={{
            id: page.id,
            title: page.title,
            slug: page.slug,
            description: page.description,
            status: page.status,
            isSystem: page.isSystem,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            ogImage: page.ogImage,
            canonicalUrl: page.canonicalUrl,
            noIndex: page.noIndex,
          }}
          canDelete={can(user.role, "content.delete")}
        />
      </div>

      <PageBuilder
        pageId={page.id}
        pageSlug={page.slug}
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
