/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Quote } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { ButtonLink } from "@/components/ui/button";
import { Counter } from "@/components/ui/counter";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { JsonLdScript } from "@/components/site/json-ld";
import { ProjectCard } from "@/components/site/cards";
import { getProjectBySlug, getProjects, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { asArray, formatDate } from "@/lib/utils";
import type { ResultItem } from "@/types";
import { isPreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return buildMetadata({ title: "Case study not found", noIndex: true });

  return buildMetadata({
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.summary,
    path: `/projects/${project.slug}`,
    image: project.ogImage || project.coverUrl,
    noIndex: project.noIndex,
  });
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const [{ slug }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const preview = await isPreview(previewParam);
  const [project, settings] = await Promise.all([getProjectBySlug(slug, preview), getSiteSettings()]);
  if (!project) notFound();

  const results = asArray<ResultItem>(project.results);
  const technologies = asArray<string>(project.technologies);
  const images = asArray<string | { url: string; alt?: string }>(project.images);
  const related = (await getProjects({ limit: 4 }))
    .filter((item) => item.id !== project.id)
    .slice(0, 3);

  return (
    <>
      {preview ? (
        <PreviewBanner
          status={project.status}
          editHref={`/admin/projects/${project.id}`}
        />
      ) : null}

      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Work", href: "/projects" },
          { name: project.title, href: `/projects/${project.slug}` },
        ])}
      />

      <PageHero
        eyebrow={project.industry?.name ?? "Case study"}
        title={project.title}
        description={project.summary}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Work", href: "/projects" },
          { name: project.title, href: `/projects/${project.slug}` },
        ]}
      >
        {project.projectUrl ? (
          <ButtonLink href={project.projectUrl} size="lg" variant="secondary">
            Visit the live product
            <ArrowUpRight className="size-4" />
          </ButtonLink>
        ) : null}
        <ButtonLink href={settings.primaryCtaUrl} size="lg">
          {settings.primaryCtaLabel}
        </ButtonLink>
      </PageHero>

      {/* Meta strip */}
      <SectionShell settings={{ spacing: "compact" }}>
        {project.clientLogoUrl ? (
          <div className="mb-6 flex items-center gap-3">
            <img
              src={project.clientLogoUrl}
              alt={project.clientName ?? "Client logo"}
              className="h-9 w-auto max-w-[160px] object-contain opacity-80"
              loading="lazy"
            />
          </div>
        ) : null}

        <dl className="grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Client", value: project.clientName },
            { label: "Industry", value: project.industry?.name },
            { label: "Year", value: project.year ? String(project.year) : null },
            { label: "Duration", value: project.duration },
            {
              label: "Services",
              value: project.services.length
                ? project.services.map((service) => service.title).join(", ")
                : null,
            },
            { label: "Published", value: formatDate(project.publishedAt) || null },
          ]
            .filter((item) => Boolean(item.value))
            .map((item) => (
              <div key={item.label} className="bg-ink-950 px-6 py-5">
                <dt className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  {item.label}
                </dt>
                <dd className="mt-2 text-[14.5px] text-ink-100">{item.value}</dd>
              </div>
            ))}
        </dl>
      </SectionShell>

      {project.coverUrl ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <Reveal>
            <div className="overflow-hidden rounded-2xl border border-white/8">
              <img
                src={project.coverUrl}
                alt={project.title}
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          </Reveal>
        </SectionShell>
      ) : null}

      {/* Challenge / solution */}
      {project.challenge || project.solutionText ? (
        <SectionShell>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {project.challenge ? (
              <div>
                <SectionHeading
                  eyebrow="Challenge"
                  title="The situation"
                  className="mb-6 lg:flex-col lg:items-start"
                />
                <div className="space-y-4 text-[16px] leading-relaxed text-ink-200">
                  {project.challenge.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {project.solutionText ? (
              <div>
                <SectionHeading
                  eyebrow="Solution"
                  title="What we built"
                  className="mb-6 lg:flex-col lg:items-start"
                />
                <div className="space-y-4 text-[16px] leading-relaxed text-ink-200">
                  {project.solutionText.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionShell>
      ) : null}

      {results.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading eyebrow="Results" title="What changed" className="mb-12" />
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {results.map((result) => (
              <RevealItem
                as="li"
                key={result.label}
                className="rounded-2xl border border-white/8 bg-white/[0.02] p-7"
              >
                <p className="text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold tracking-tight text-ink-50">
                  <Counter value={result.value} />
                </p>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-300">{result.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </SectionShell>
      ) : null}

      {images.length ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <ul className="grid gap-4 md:grid-cols-2">
            {images.map((image, index) => {
              const url = typeof image === "string" ? image : image.url;
              const alt = typeof image === "string" ? "" : (image.alt ?? "");
              if (!url) return null;
              return (
                <li key={`${url}-${index}`} className="overflow-hidden rounded-2xl border border-white/8">
                  <img src={url} alt={alt} className="w-full object-cover" loading="lazy" />
                </li>
              );
            })}
          </ul>
        </SectionShell>
      ) : null}

      {project.videoUrl ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <div className="aspect-video overflow-hidden rounded-2xl border border-white/8 bg-ink-900">
            <video src={project.videoUrl} controls preload="metadata" className="size-full" />
          </div>
        </SectionShell>
      ) : null}

      {technologies.length ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">
            Built with
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 font-mono text-[12.5px] text-ink-200"
              >
                {tech}
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {project.testimonial ? (
        <SectionShell>
          <figure className="mx-auto max-w-3xl rounded-2xl border border-white/8 bg-white/[0.02] p-9 text-center">
            <Quote className="mx-auto size-7 text-[var(--accent)] opacity-70" />
            <blockquote className="mt-6 text-[clamp(1.15rem,2.2vw,1.5rem)] font-medium leading-relaxed tracking-tight text-ink-50">
              “{project.testimonial.quote}”
            </blockquote>
            <figcaption className="mt-6 text-[14px] text-ink-300">
              <span className="font-medium text-ink-100">{project.testimonial.clientName}</span>
              {project.testimonial.designation || project.testimonial.company ? (
                <>
                  {" — "}
                  {[project.testimonial.designation, project.testimonial.company]
                    .filter(Boolean)
                    .join(", ")}
                </>
              ) : null}
            </figcaption>
          </figure>
        </SectionShell>
      ) : null}

      {project.services.length ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">
            Services involved
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.services.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 text-[13.5px] text-ink-200 transition-colors hover:border-white/30 hover:text-ink-50"
                >
                  {service.title}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {related.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading
            eyebrow="More work"
            title="Related case studies"
            action={{ label: "All work", href: "/projects" }}
            className="mb-12"
          />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <ProjectCard project={item} />
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      <CtaBlock
        content={{
          title: "Have a project like this?",
          description: "Tell us where you are and we will map the route from here.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
