import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { SolutionCard } from "@/components/site/cards";
import { JsonLdScript } from "@/components/site/json-ld";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getSolutions, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Solutions",
    description:
      "Business automation, digital transformation, ERP and CRM systems, customer portals, AI assistants and enterprise platforms.",
    path: "/solutions",
  });
}

export default async function SolutionsPage() {
  const [solutions, settings] = await Promise.all([getSolutions(), getSiteSettings()]);

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Solutions", href: "/solutions" },
        ])}
      />

      <PageHero
        eyebrow="Solutions"
        title="Business systems,"
        highlight="built to fit."
        description="Outcome-shaped programmes rather than product categories. Each one combines the engineering, design and operations work needed to make it hold up in production."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Solutions", href: "/solutions" },
        ]}
      >
        <ButtonLink href={settings.primaryCtaUrl} size="lg">
          {settings.primaryCtaLabel}
        </ButtonLink>
        <ButtonLink href="/services" variant="outline" size="lg">
          Browse services
        </ButtonLink>
      </PageHero>

      <SectionShell>
        {solutions.length ? (
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {solutions.map((solution) => (
              <RevealItem as="li" key={solution.id}>
                <SolutionCard solution={solution} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/12 p-10 text-center text-[15px] text-ink-300">
            No solutions published yet. Add them in the CMS under Content → Solutions.
          </p>
        )}
      </SectionShell>

      <CtaBlock
        content={{
          title: "Tell us the outcome you need.",
          description: "We will map the shortest credible route to it — and tell you what it costs.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
