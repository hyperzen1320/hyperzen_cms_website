import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockList } from "@/components/sections/block-renderer";
import { PageHero } from "@/components/sections/page-hero";
import { PreviewBanner } from "@/components/site/preview-banner";
import { getPageBySlug, getPageForPreview } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { isPreview } from "@/lib/preview";

/**
 * Renders a page composed in the CMS page builder. Routes such as /about and
 * /privacy-policy are thin wrappers around this, so their entire content is
 * editable without touching code.
 */
export async function CmsPage({
  slug,
  previewFlag,
  fallbackTitle,
  fallbackDescription,
}: {
  slug: string;
  previewFlag?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}) {
  const preview = await isPreview(previewFlag);
  const page = preview ? await getPageForPreview(slug) : await getPageBySlug(slug);

  if (!page) {
    if (!fallbackTitle) notFound();
    return (
      <PageHero
        eyebrow="Page"
        title={fallbackTitle}
        description={
          fallbackDescription ??
          "This page has not been created in the CMS yet. Add it under Content → Pages."
        }
      />
    );
  }

  const banner = preview ? (
    <PreviewBanner
      status={page.status}
      editHref={slug === "home" ? "/admin/homepage" : `/admin/pages/${page.id}`}
    />
  ) : null;

  if (!page.sections.length) {
    return (
      <>
        {banner}
        <PageHero eyebrow="Page" title={page.title} description={page.description} />
      </>
    );
  }

  return (
    <>
      {banner}
      <BlockList sections={page.sections} />
    </>
  );
}

export async function cmsPageMetadata(
  slug: string,
  fallback: { title: string; description?: string },
): Promise<Metadata> {
  const page = await getPageBySlug(slug);
  return buildMetadata({
    title: page?.seoTitle || page?.title || fallback.title,
    description: page?.seoDescription || page?.description || fallback.description,
    path: `/${slug}`,
    image: page?.ogImage,
    canonical: page?.canonicalUrl,
    noIndex: page?.noIndex,
  });
}
