import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, Clock, MapPin } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { JsonLdScript } from "@/components/site/json-ld";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { getJobs, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

const EMPLOYMENT_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
};

const WORK_MODE_LABEL: Record<string, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Careers",
    description:
      "Open roles at Hyperzen Innovation — engineering, design and delivery for people who want to build systems that hold up.",
    path: "/careers",
  });
}

export default async function CareersPage() {
  const [jobs, settings] = await Promise.all([getJobs(), getSiteSettings()]);

  const departments = Array.from(new Set(jobs.map((job) => job.department)));

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
        ])}
      />

      <PageHero
        eyebrow="Careers"
        title="Build things that"
        highlight="hold up."
        description="We are a small team that cares about craft: readable systems, honest estimates, and work handed over properly. If that sounds like how you want to work, we would like to hear from you."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
        ]}
      />

      <SectionShell>
        <SectionHeading
          eyebrow="Open roles"
          title={jobs.length ? `${jobs.length} open ${jobs.length === 1 ? "role" : "roles"}` : "No open roles right now"}
          description={
            jobs.length
              ? "Every role is genuinely open — we do not post placeholders."
              : "There is nothing open at the moment. Send us a note anyway if you think you would be a fit; we keep good applications on file."
          }
          className="mb-10"
        />

        {jobs.length ? (
          <>
            {departments.length > 1 ? (
              <ul className="mb-8 flex flex-wrap gap-2">
                {departments.map((department) => (
                  <li
                    key={department}
                    className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12.5px] text-ink-300"
                  >
                    {department}
                  </li>
                ))}
              </ul>
            ) : null}

            <RevealGroup className="divide-y divide-white/8 border-y border-white/8" as="ul">
              {jobs.map((job) => (
                <RevealItem as="li" key={job.id}>
                  <Link
                    href={`/careers/${job.slug}`}
                    className="group flex flex-col gap-4 py-7 transition-colors sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="text-[19px] font-medium tracking-tight text-ink-50 transition-colors group-hover:text-white">
                        {job.title}
                      </h3>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-300">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-ink-500" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-ink-500" />
                          {job.location} · {WORK_MODE_LABEL[job.workMode]}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-ink-500" />
                          {EMPLOYMENT_LABEL[job.employmentType]}
                        </span>
                        {job.experience ? <span>{job.experience}</span> : null}
                      </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-white/12 px-4 py-2 text-[13.5px] text-ink-100 transition-colors group-hover:border-white/35 group-hover:bg-white/[0.05] sm:self-auto">
                      View role
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </>
        ) : (
          <Reveal>
            <div className="rounded-2xl border border-dashed border-white/12 p-12 text-center">
              <p className="text-[16px] font-medium text-ink-100">No open positions today.</p>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-300">
                We still read every speculative application. Tell us what you build and what you
                would like to work on.
              </p>
              {settings.email ? (
                <a
                  href={`mailto:${settings.email}?subject=Speculative application`}
                  className="mt-6 inline-flex h-11 items-center rounded-full bg-ink-50 px-6 text-[14px] font-semibold text-ink-950 transition-colors hover:bg-white"
                >
                  Send an introduction
                </a>
              ) : null}
            </div>
          </Reveal>
        )}
      </SectionShell>

      <CtaBlock
        content={{
          title: "Not seeing your role?",
          description:
            "We hire when we meet people worth hiring. If you build carefully and communicate clearly, get in touch.",
          ctaLabel: "Get in touch",
          ctaUrl: "/contact",
        }}
      />
    </>
  );
}
