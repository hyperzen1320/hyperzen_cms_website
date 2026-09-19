import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { ProjectCard } from "@/components/site/cards";
import { JsonLdScript } from "@/components/site/json-ld";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { getIndustries, getProjects, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ industry?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Work",
    description:
      "Case studies from Hyperzen Innovation — the problem, the system we built and the measured outcome.",
    path: "/projects",
  });
}

export default async function ProjectsPage({ searchParams }: Props) {
  const { industry } = await searchParams;
  const [allProjects, industries, settings] = await Promise.all([
    getProjects(),
    getIndustries(),
    getSiteSettings(),
  ]);

  const projects = industry
    ? allProjects.filter((project) => project.industry?.slug === industry)
    : allProjects;

  // Only offer filters for industries that actually have published work.
  const usedSlugs = new Set(allProjects.map((project) => project.industry?.slug).filter(Boolean));
  const usedIndustries = industries.filter((item) => usedSlugs.has(item.slug));

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Work", href: "/projects" },
        ])}
      />

      <PageHero
        eyebrow="Selected work"
        title="Systems shipped,"
        highlight="outcomes measured."
        description="Each case study covers the situation we found, the decisions we made, and what changed as a result."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Work", href: "/projects" },
        ]}
      />

      <SectionShell>
        {usedIndustries.length ? (
          <nav aria-label="Filter by industry" className="mb-10 flex flex-wrap gap-2">
            <Link
              href="/projects"
              className={cn(
                "rounded-full border px-4 py-2 text-[13.5px] transition-colors duration-300",
                !industry
                  ? "border-white/35 bg-white/[0.08] text-ink-50"
                  : "border-white/12 text-ink-300 hover:border-white/28 hover:text-ink-50",
              )}
            >
              All work
            </Link>
            {usedIndustries.map((item) => (
              <Link
                key={item.id}
                href={`/projects?industry=${item.slug}`}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13.5px] transition-colors duration-300",
                  industry === item.slug
                    ? "border-white/35 bg-white/[0.08] text-ink-50"
                    : "border-white/12 text-ink-300 hover:border-white/28 hover:text-ink-50",
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        ) : null}

        {projects.length ? (
          <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" as="ul">
            {projects.map((project, index) => (
              <RevealItem as="li" key={project.id} className={index === 0 ? "lg:col-span-2" : ""}>
                <ProjectCard project={project} featured={index === 0} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/12 p-12 text-center">
            <p className="text-[16px] font-medium text-ink-100">
              {industry ? "No case studies in this industry yet." : "Case studies are on the way."}
            </p>
            <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-300">
              We publish work only once the client has approved the details and the results can be
              verified. Ask us directly and we will walk you through relevant engagements.
            </p>
            <Link
              href={settings.primaryCtaUrl}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-ink-50 px-6 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white"
            >
              Ask about our work
            </Link>
          </div>
        )}
      </SectionShell>

      <CtaBlock
        content={{
          title: "Your project could be the next one here.",
          description: "Tell us what you are building and we will map the route to it.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
