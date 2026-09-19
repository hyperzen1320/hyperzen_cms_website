import { HeroBlock, type HeroContent } from "@/components/sections/hero";
import { StatsBlock, type StatsContent } from "@/components/sections/stats";
import {
  CtaBlock,
  FeatureGridBlock,
  ImageBlock,
  LogoCloudBlock,
  ProcessBlock,
  RichTextBlock,
  TextBlock,
  ThreeCardsBlock,
  TwoColumnBlock,
  VideoBlock,
} from "@/components/sections/content-blocks";
import {
  IndustryGridBlock,
  InsightsGridBlock,
  ProductGridBlock,
  ProjectGridBlock,
  ServicesGridBlock,
  SolutionsGridBlock,
  TestimonialsBlock,
} from "@/components/sections/collections";
import { FaqBlock } from "@/components/sections/faq";
import { ContactFormBlock } from "@/components/sections/contact-form-block";
import type { PageSection } from "@prisma/client";
import type { BlockSettings } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Renders one CMS page-builder section. Unknown block types render nothing
 * rather than crashing the page, so a schema change can never take the site
 * down.
 */
export function BlockRenderer({ section }: { section: PageSection }) {
  const content = (section.content ?? {}) as any;
  const settings = (section.settings ?? {}) as BlockSettings;

  switch (section.blockType) {
    case "HERO":
      return <HeroBlock content={content as HeroContent} />;
    case "STATS":
      return <StatsBlock content={content as StatsContent} settings={settings} />;
    case "TEXT":
      return <TextBlock content={content} settings={settings} />;
    case "RICH_TEXT":
      return <RichTextBlock content={content} settings={settings} />;
    case "IMAGE":
      return <ImageBlock content={content} settings={settings} />;
    case "VIDEO":
      return <VideoBlock content={content} settings={settings} />;
    case "TWO_COLUMN":
      return <TwoColumnBlock content={content} settings={settings} />;
    case "THREE_CARDS":
      return <ThreeCardsBlock content={content} settings={settings} />;
    case "FEATURE_GRID":
      return <FeatureGridBlock content={content} settings={settings} />;
    case "PROCESS":
      return <ProcessBlock content={content} settings={settings} />;
    case "LOGO_CLOUD":
      return <LogoCloudBlock content={content} settings={settings} />;
    case "CTA":
      return <CtaBlock content={content} settings={settings} />;
    case "SERVICES_GRID":
      return <ServicesGridBlock content={content} settings={settings} />;
    case "SOLUTIONS_GRID":
      return <SolutionsGridBlock content={content} settings={settings} />;
    case "INDUSTRY_GRID":
      return <IndustryGridBlock content={content} settings={settings} />;
    case "PROJECT_GRID":
      return <ProjectGridBlock content={content} settings={settings} />;
    case "PRODUCT_GRID":
      return <ProductGridBlock content={content} settings={settings} />;
    case "INSIGHTS_GRID":
      return <InsightsGridBlock content={content} settings={settings} />;
    case "TESTIMONIALS":
      return <TestimonialsBlock content={content} settings={settings} />;
    case "FAQ":
      return <FaqBlock content={content} settings={settings} />;
    case "CONTACT_FORM":
      return <ContactFormBlock content={content} settings={settings} />;
    default:
      return null;
  }
}

export function BlockList({ sections }: { sections: PageSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <BlockRenderer key={section.id} section={section} />
      ))}
    </>
  );
}

