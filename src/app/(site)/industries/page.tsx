import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { IndustryCard } from "@/components/site/cards";
import { JsonLdScript } from "@/components/site/json-ld";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getIndustries, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Industries",
    description:
      "Healthcare, education, finance, logistics, manufacturing, e-commerce, real estate, startups and enterprises — sector context that shortens discovery.",
    path: "/industries",
  });
}

export default async function IndustriesPage() {
  const [industries, settings] = await Promise.all([getIndustries(), getSiteSettings()]);

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Industries", href: "/industries" },
        ])}
      />

      <PageHero
        eyebrow="Industries"
        title="Context we already"
        highlight="understand."
        description="Sector knowledge shortens discovery and avoids expensive wrong turns. These are the environments we work in most often — and the constraints we design for from day one."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Industries", href: "/industries" },
        ]}
      >
        <ButtonLink href={settings.primaryCtaUrl} size="lg">
          {settings.primaryCtaLabel}
        </ButtonLink>
      </PageHero>

      <SectionShell>
        {industries.length ? (
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {industries.map((industry) => (
              <RevealItem as="li" key={industry.id}>
                <IndustryCard industry={industry} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/12 p-10 text-center text-[15px] text-ink-300">
            No industries published yet. Add them in the CMS under Content → Industries.
          </p>
        )}
      </SectionShell>

      <CtaBlock
        content={{
          title: "Working in a sector not listed here?",
          description:
            "Most of what we do transfers. Tell us about the domain and we will be honest about where our experience helps and where it does not.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
