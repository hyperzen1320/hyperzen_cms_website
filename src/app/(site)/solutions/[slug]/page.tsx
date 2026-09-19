import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { JsonLdScript } from "@/components/site/json-ld";
import { SolutionCard } from "@/components/site/cards";
import { getSolutionBySlug, getSolutions, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, faqSchema } from "@/lib/seo";
import { asArray } from "@/lib/utils";
import type { FaqItem } from "@/types";
import { isPreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getSolutionBySlug(slug);
  if (!solution) return buildMetadata({ title: "Solution not found", noIndex: true });

  return buildMetadata({
    title: solution.seoTitle || solution.title,
    description: solution.seoDescription || solution.shortDesc,
    path: `/solutions/${solution.slug}`,
    image: solution.ogImage || solution.imageUrl,
    noIndex: solution.noIndex,
  });
}

export default async function SolutionDetailPage({ params, searchParams }: Props) {
  const [{ slug }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const preview = await isPreview(previewParam);
  const [solution, settings] = await Promise.all([getSolutionBySlug(slug, preview), getSiteSettings()]);
  if (!solution) notFound();

  const outcomes = asArray<string>(solution.outcomes);
  const capabilities = asArray<string>(solution.capabilities);
  const deliverables = asArray<string>(solution.deliverables);
  const technologies = asArray<string>(solution.technologies);
  const faqs = asArray<FaqItem>(solution.faqs);
  const related = (await getSolutions()).filter((item) => item.id !== solution.id).slice(0, 3);

  return (
    <>
      {preview ? (
        <PreviewBanner
          status={solution.status}
          editHref={`/admin/solutions/${solution.id}`}
        />
      ) : null}

      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Solutions", href: "/solutions" },
          { name: solution.title, href: `/solutions/${solution.slug}` },
        ])}
      />
      {faqs.length ? <JsonLdScript data={faqSchema(faqs)} /> : null}

      <PageHero
        eyebrow="Solution"
        title={solution.heroTitle || solution.title}
        description={solution.shortDesc}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Solutions", href: "/solutions" },
          { name: solution.title, href: `/solutions/${solution.slug}` },
        ]}
      >
        <ButtonLink href={settings.primaryCtaUrl} size="lg">
          {settings.primaryCtaLabel}
        </ButtonLink>
      </PageHero>

      {solution.overview ? (
        <SectionShell>
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Overview"
                title="What this covers"
                className="mb-6 lg:flex-col lg:items-start"
              />
              <div className="max-w-2xl space-y-4 text-[16px] leading-relaxed text-ink-200">
                {solution.overview.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {outcomes.length ? (
              <div className="h-fit rounded-2xl border border-white/8 bg-white/[0.02] p-7">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Outcomes
                </p>
                <ul className="mt-5 space-y-3">
                  {outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      <span className="text-[14.5px] leading-relaxed text-ink-100">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </SectionShell>
      ) : null}

      {capabilities.length || deliverables.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <div className="grid gap-10 md:grid-cols-2">
            {capabilities.length ? (
              <div>
                <h2 className="text-[20px] font-medium tracking-tight text-ink-50">Capabilities</h2>
                <ul className="mt-5 space-y-2.5">
                  {capabilities.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-white/8 px-4 py-3 text-[14.5px] text-ink-200"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {deliverables.length ? (
              <div>
                <h2 className="text-[20px] font-medium tracking-tight text-ink-50">Deliverables</h2>
                <ul className="mt-5 space-y-2.5">
                  {deliverables.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-white/8 px-4 py-3 text-[14.5px] text-ink-200"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {technologies.length ? (
            <ul className="mt-10 flex flex-wrap gap-2">
              {technologies.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-white/10 px-3.5 py-1.5 font-mono text-[12.5px] text-ink-300"
                >
                  {tech}
                </li>
              ))}
            </ul>
          ) : null}
        </SectionShell>
      ) : null}

      {faqs.length ? (
        <SectionShell>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <SectionHeading eyebrow="FAQ" title="Questions" className="lg:flex-col lg:items-start" />
            <Accordion items={faqs} />
          </div>
        </SectionShell>
      ) : null}

      {related.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading
            eyebrow="Related"
            title="Other solutions"
            action={{ label: "All solutions", href: "/solutions" }}
            className="mb-12"
          />
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {related.map((item) => (
              <RevealItem as="li" key={item.id}>
                <SolutionCard solution={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </SectionShell>
      ) : null}

      <CtaBlock
        content={{
          title: `Let's talk about ${solution.title.toLowerCase()}.`,
          description: "Describe where you are today and we will map the route from here.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
