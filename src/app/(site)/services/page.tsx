import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { FaqBlock } from "@/components/sections/faq";
import { ServiceCard } from "@/components/site/cards";
import { JsonLdScript } from "@/components/site/json-ld";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { getServices, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Services",
    description:
      "AI solutions, automation, web and mobile applications, SaaS products, custom software, design, cloud, data and SEO — engineered end to end.",
    path: "/services",
  });
}

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([getServices(), getSiteSettings()]);

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ])}
      />

      <PageHero
        eyebrow="Services"
        title="Engineering across the full"
        highlight="product surface."
        description="One team covering strategy, design, engineering and operations — so the hard problems that sit between disciplines do not fall through the gaps."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ]}
      >
        <ButtonLink href={settings.primaryCtaUrl} size="lg">
          {settings.primaryCtaLabel}
        </ButtonLink>
        <ButtonLink href="/projects" variant="outline" size="lg">
          See the work
        </ButtonLink>
      </PageHero>

      <SectionShell settings={{ spacing: "normal" }}>
        {services.length ? (
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {services.map((service) => (
              <RevealItem as="li" key={service.id}>
                <ServiceCard service={service} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/12 p-10 text-center text-[15px] text-ink-300">
            No services published yet. Add them in the CMS under Content → Services.
          </p>
        )}
      </SectionShell>

      <FaqBlock
        content={{ title: "Common questions", limit: 6 }}
        settings={{ background: "subtle" }}
      />

      <CtaBlock
        content={{
          title: "Not sure which service you need?",
          description:
            "Describe the outcome you are after. We will tell you what it takes — and if it is smaller than you expected, we will say so.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
          secondaryCtaLabel: "Book a consultation",
          secondaryCtaUrl: "/book-consultation",
        }}
      />
    </>
  );
}
