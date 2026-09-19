import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { CtaBlock, ProcessBlock } from "@/components/sections/content-blocks";
import { Accordion } from "@/components/ui/accordion";
import { Icon } from "@/components/ui/icon";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SpotlightCard } from "@/components/ui/spotlight";
import { JsonLdScript } from "@/components/site/json-ld";
import { ServiceCard } from "@/components/site/cards";
import { getServiceBySlug, getServices, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, faqSchema, serviceSchema } from "@/lib/seo";
import { asArray } from "@/lib/utils";
import type { FaqItem, FeatureItem, ProcessStep } from "@/types";
import { isPreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return buildMetadata({ title: "Service not found", noIndex: true });

  return buildMetadata({
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.shortDesc,
    path: `/services/${service.slug}`,
    image: service.ogImage || service.imageUrl,
    noIndex: service.noIndex,
  });
}

export default async function ServiceDetailPage({ params, searchParams }: Props) {
  const [{ slug }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const preview = await isPreview(previewParam);
  const [service, settings] = await Promise.all([getServiceBySlug(slug, preview), getSiteSettings()]);
  if (!service) notFound();

  const features = asArray<FeatureItem>(service.features);
  const capabilities = asArray<string>(service.capabilities);
  const process = asArray<ProcessStep>(service.process);
  const technologies = asArray<string>(service.technologies);
  const benefits = asArray<string>(service.benefits);
  const useCases = asArray<{ title: string; description?: string }>(service.useCases);
  const faqs = asArray<FaqItem>(service.faqs);

  const related = (await getServices()).filter((item) => item.id !== service.id).slice(0, 3);

  return (
    <>
      {preview ? (
        <PreviewBanner
          status={service.status}
          editHref={`/admin/services/${service.id}`}
        />
      ) : null}

      <JsonLdScript
        data={serviceSchema({
          name: service.title,
          description: service.shortDesc,
          slug: service.slug,
          providerName: settings.companyName,
        })}
      />
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: service.title, href: `/services/${service.slug}` },
        ])}
      />
      {faqs.length ? <JsonLdScript data={faqSchema(faqs)} /> : null}

      <PageHero
        eyebrow={service.tagline || "Service"}
        title={service.heroTitle || service.title}
        description={service.heroSubtitle || service.shortDesc}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: service.title, href: `/services/${service.slug}` },
        ]}
      >
        <ButtonLink href={service.ctaUrl || settings.primaryCtaUrl} size="lg">
          {service.ctaLabel || settings.primaryCtaLabel}
          <ArrowRight className="size-4" />
        </ButtonLink>
        <ButtonLink href="/projects" variant="outline" size="lg">
          See related work
        </ButtonLink>
      </PageHero>

      {/* Problem / solution */}
      {service.problemText || service.solutionText ? (
        <SectionShell settings={{ spacing: "normal" }}>
          <div className="grid gap-6 lg:grid-cols-2">
            {service.problemText ? (
              <Reveal className="h-full">
                <div className="h-full rounded-2xl border border-white/8 bg-white/[0.02] p-8">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                    The problem
                  </p>
                  <h2 className="mt-4 text-[22px] font-medium leading-snug tracking-tight text-ink-50">
                    {service.problemTitle || "Where teams get stuck"}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-300">
                    {service.problemText}
                  </p>
                </div>
              </Reveal>
            ) : null}

            {service.solutionText ? (
              <Reveal delay={0.1} className="h-full">
                <div
                  className="h-full rounded-2xl border p-8"
                  style={{
                    borderColor: "color-mix(in oklab, var(--accent) 30%, transparent)",
                    background:
                      "linear-gradient(180deg, color-mix(in oklab, var(--accent) 9%, transparent), transparent)",
                  }}
                >
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    Our approach
                  </p>
                  <h2 className="mt-4 text-[22px] font-medium leading-snug tracking-tight text-ink-50">
                    {service.solutionTitle || "How we solve it"}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-ink-200">
                    {service.solutionText}
                  </p>
                </div>
              </Reveal>
            ) : null}
          </div>

          {service.detailedDesc ? (
            <Reveal delay={0.15}>
              <div className="mt-10 max-w-3xl space-y-4 text-[16px] leading-relaxed text-ink-200">
                {service.detailedDesc.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          ) : null}
        </SectionShell>
      ) : null}

      {/* Capabilities */}
      {features.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading
            eyebrow="Capabilities"
            title="What the engagement includes"
            className="mb-12"
          />
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {features.map((feature) => (
              <RevealItem as="li" key={feature.title}>
                <SpotlightCard className="h-full p-7">
                  <Icon name={feature.icon} className="size-5 text-[var(--accent)]" />
                  <h3 className="mt-5 text-[16.5px] font-medium text-ink-50">{feature.title}</h3>
                  {feature.description ? (
                    <p className="mt-2.5 text-[14px] leading-relaxed text-ink-300">
                      {feature.description}
                    </p>
                  ) : null}
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>

          {capabilities.length ? (
            <div className="mt-10 rounded-2xl border border-white/8 p-7">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                Also covered
              </p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {capabilities.map((capability) => (
                  <li key={capability} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                    <span className="text-[14.5px] text-ink-200">{capability}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SectionShell>
      ) : null}

      {/* Process */}
      {process.length ? (
        <ProcessBlock
          content={{
            eyebrow: "Process",
            title: "How delivery runs",
            description: "Each phase ends with something you can see, use and judge.",
            steps: process,
          }}
          settings={{ background: "grid" }}
        />
      ) : null}

      {/* Technologies + benefits */}
      {technologies.length || benefits.length ? (
        <SectionShell>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {technologies.length ? (
              <div>
                <SectionHeading
                  eyebrow="Technology"
                  title="What we build with"
                  className="mb-8 lg:flex-col lg:items-start"
                  level="h2"
                />
                <ul className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <li
                      key={tech}
                      className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 font-mono text-[12.5px] text-ink-200"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {benefits.length ? (
              <div>
                <SectionHeading
                  eyebrow="Outcomes"
                  title="What you get"
                  className="mb-8 lg:flex-col lg:items-start"
                  level="h2"
                />
                <ul className="space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
                        <Check className="size-3 text-[var(--accent)]" />
                      </span>
                      <span className="text-[15px] leading-relaxed text-ink-100">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </SectionShell>
      ) : null}

      {/* Use cases */}
      {useCases.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading eyebrow="Use cases" title="Where this applies" className="mb-12" />
          <RevealGroup
            className="grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.06] md:grid-cols-3"
            as="ul"
          >
            {useCases.map((useCase, index) => (
              <RevealItem as="li" key={useCase.title} className="bg-ink-950 p-7">
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

      {/* FAQ */}
      {faqs.length ? (
        <SectionShell>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <SectionHeading
              eyebrow="FAQ"
              title={`${service.title} questions`}
              className="lg:flex-col lg:items-start"
            />
            <Accordion items={faqs} />
          </div>
        </SectionShell>
      ) : null}

      {/* Related services */}
      {related.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading
            eyebrow="Related"
            title="Other services"
            action={{ label: "All services", href: "/services" }}
            className="mb-12"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <ServiceCard service={item} />
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      <CtaBlock
        content={{
          title: service.ctaTitle || `Ready to talk about ${service.title.toLowerCase()}?`,
          description:
            service.ctaDescription ||
            "Tell us where you are today and what you need to be true in six months.",
          ctaLabel: service.ctaLabel || settings.primaryCtaLabel,
          ctaUrl: service.ctaUrl || settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
