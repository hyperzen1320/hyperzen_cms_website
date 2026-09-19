import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Check } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { JsonLdScript } from "@/components/site/json-ld";
import { IndustryCard, ProjectCard } from "@/components/site/cards";
import { getIndustries, getIndustryBySlug, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, faqSchema } from "@/lib/seo";
import { asArray } from "@/lib/utils";
import type { FaqItem, Metric } from "@/types";
import { isPreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);
  if (!industry) return buildMetadata({ title: "Industry not found", noIndex: true });

  return buildMetadata({
    title: industry.seoTitle || `${industry.name} technology solutions`,
    description: industry.seoDescription || industry.shortDesc,
    path: `/industries/${industry.slug}`,
    image: industry.ogImage || industry.imageUrl,
    noIndex: industry.noIndex,
  });
}

export default async function IndustryDetailPage({ params, searchParams }: Props) {
  const [{ slug }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const preview = await isPreview(previewParam);
  const [industry, settings] = await Promise.all([getIndustryBySlug(slug, preview), getSiteSettings()]);
  if (!industry) notFound();

  const challenges = asArray<string>(industry.challenges);
  const solutions = asArray<string>(industry.solutions);
  const useCases = asArray<{ title: string; description?: string }>(industry.useCases);
  const stats = asArray<Metric>(industry.stats);
  const faqs = asArray<FaqItem>(industry.faqs);
  const related = (await getIndustries()).filter((item) => item.id !== industry.id).slice(0, 3);

  return (
    <>
      {preview ? (
        <PreviewBanner
          status={industry.status}
          editHref={`/admin/industries/${industry.id}`}
        />
      ) : null}

      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Industries", href: "/industries" },
          { name: industry.name, href: `/industries/${industry.slug}` },
        ])}
      />
      {faqs.length ? <JsonLdScript data={faqSchema(faqs)} /> : null}

      <PageHero
        eyebrow="Industry"
        title={industry.heroTitle || `Technology for ${industry.name.toLowerCase()}`}
        description={industry.shortDesc}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Industries", href: "/industries" },
          { name: industry.name, href: `/industries/${industry.slug}` },
        ]}
      >
        <ButtonLink href={settings.primaryCtaUrl} size="lg">
          {settings.primaryCtaLabel}
        </ButtonLink>
      </PageHero>

      {stats.length ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.06] lg:grid-cols-4">
            {stats.map((stat) => (
              <li key={stat.label} className="bg-ink-950 px-6 py-8">
                <p className="text-[clamp(1.7rem,3vw,2.4rem)] font-semibold tracking-tight text-ink-50">
                  <Counter value={stat.value} />
                </p>
                <p className="mt-2 text-[13.5px] text-ink-200">{stat.label}</p>
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {industry.description ? (
        <SectionShell>
          <div className="max-w-3xl space-y-4 text-[16.5px] leading-relaxed text-ink-200">
            {industry.description.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </SectionShell>
      ) : null}

      {challenges.length || solutions.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <div className="grid gap-6 lg:grid-cols-2">
            {challenges.length ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8">
                <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                  <AlertTriangle className="size-3.5" />
                  Challenges
                </p>
                <ul className="mt-6 space-y-4">
                  {challenges.map((challenge) => (
                    <li key={challenge} className="flex items-start gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-400" />
                      <span className="text-[15px] leading-relaxed text-ink-200">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {solutions.length ? (
              <div
                className="rounded-2xl border p-8"
                style={{
                  borderColor: "color-mix(in oklab, var(--accent) 30%, transparent)",
                  background:
                    "linear-gradient(180deg, color-mix(in oklab, var(--accent) 9%, transparent), transparent)",
                }}
              >
                <p className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  <Check className="size-3.5" />
                  How we help
                </p>
                <ul className="mt-6 space-y-4">
                  {solutions.map((solution) => (
                    <li key={solution} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      <span className="text-[15px] leading-relaxed text-ink-100">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </SectionShell>
      ) : null}

      {useCases.length ? (
        <SectionShell>
          <SectionHeading eyebrow="Use cases" title="Where we typically start" className="mb-12" />
          <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" as="ul">
            {useCases.map((useCase, index) => (
              <RevealItem
                as="li"
                key={useCase.title}
                className="rounded-2xl border border-white/8 bg-white/[0.02] p-7"
              >
                <span className="font-mono text-[12px] text-[var(--accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[17px] font-medium text-ink-50">{useCase.title}</h3>
                {useCase.description ? (
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-300">
                    {useCase.description}
                  </p>
                ) : null}
              </RevealItem>
            ))}
          </RevealGroup>
        </SectionShell>
      ) : null}

      {industry.projects?.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading
            eyebrow="Case studies"
            title={`${industry.name} work`}
            action={{ label: "All work", href: "/projects" }}
            className="mb-12"
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {industry.projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
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
            title="Other industries"
            action={{ label: "All industries", href: "/industries" }}
            className="mb-12"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <IndustryCard industry={item} />
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      <CtaBlock
        content={{
          title: `Building something for ${industry.name.toLowerCase()}?`,
          description: "Tell us about the constraints. We will tell you what is realistic.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
