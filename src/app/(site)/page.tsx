import type { Metadata } from "next";
import { BlockList } from "@/components/sections/block-renderer";
import { HeroBlock } from "@/components/sections/hero";
import { CtaBlock } from "@/components/sections/content-blocks";
import {
  IndustryGridBlock,
  InsightsGridBlock,
  ProjectGridBlock,
  ServicesGridBlock,
  TestimonialsBlock,
} from "@/components/sections/collections";
import { PreviewBanner } from "@/components/site/preview-banner";
import { getPageBySlug, getPageForPreview, getSiteSettings } from "@/lib/queries";
import { isPreview } from "@/lib/preview";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ preview?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([getPageBySlug("home"), getSiteSettings()]);
  return buildMetadata({
    title: page?.seoTitle || `${settings.companyName} — ${settings.tagline}`,
    description: page?.seoDescription || settings.description,
    path: "/",
    titleAbsolute: true,
    image: page?.ogImage,
    noIndex: page?.noIndex,
  });
}

export default async function HomePage({ searchParams }: Props) {
  const { preview: previewParam } = await searchParams;
  const preview = await isPreview(previewParam);
  const page = preview ? await getPageForPreview("home") : await getPageBySlug("home");

  if (page?.sections.length) {
    return (
      <>
        {preview ? <PreviewBanner status={page.status} editHref="/admin/homepage" /> : null}
        <BlockList sections={page.sections} />
      </>
    );
  }

  return <DefaultHome />;
}

/**
 * Rendered until the homepage is composed in the CMS (or if every section is
 * hidden), so a fresh install still presents a complete, credible page.
 */
async function DefaultHome() {
  const settings = await getSiteSettings();

  return (
    <>
      <HeroBlock
        content={{
          eyebrow: settings.tagline || "Where ideas meet innovation",
          headline: "Empowering Future",
          highlight: "Enterprises.",
          description:
            settings.description ||
            "Hyperzen builds intelligent digital systems, software products and automation solutions that help ambitious businesses move faster.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
          secondaryCtaLabel: "Explore Our Work",
          secondaryCtaUrl: "/projects",
          badges: ["AI & automation", "Product engineering", "Cloud & data", "Design systems"],
        }}
      />
      <ServicesGridBlock content={{ limit: 6, ctaLabel: "All services", ctaUrl: "/services" }} />
      <IndustryGridBlock content={{ limit: 8 }} settings={{ background: "subtle" }} />
      <ProjectGridBlock content={{ limit: 3, ctaLabel: "View all work", ctaUrl: "/projects" }} />
      <TestimonialsBlock content={{ limit: 3 }} settings={{ background: "subtle" }} />
      <InsightsGridBlock content={{ limit: 3, ctaLabel: "All insights", ctaUrl: "/insights" }} />
      <CtaBlock
        content={{
          title: "Let's build something extraordinary.",
          description:
            "Tell us what you are trying to build. We will come back with a clear route, an honest timeline and the team to deliver it.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
          secondaryCtaLabel: "Book a consultation",
          secondaryCtaUrl: "/book-consultation",
        }}
      />
    </>
  );
}
