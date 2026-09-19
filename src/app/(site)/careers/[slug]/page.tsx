import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2, Check, Clock, MapPin, Wallet } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { JsonLdScript } from "@/components/site/json-ld";
import { JobApplicationForm } from "@/components/site/job-application-form";
import { getJobBySlug, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, jobPostingSchema } from "@/lib/seo";
import { asArray } from "@/lib/utils";
import { isPreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

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

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return buildMetadata({ title: "Role not found", noIndex: true });

  return buildMetadata({
    title: job.seoTitle || job.title,
    description: job.seoDescription || job.description.slice(0, 200),
    path: `/careers/${job.slug}`,
    noIndex: job.noIndex,
  });
}

export default async function JobPage({ params, searchParams }: Props) {
  const [{ slug }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const preview = await isPreview(previewParam);
  const [job, settings] = await Promise.all([getJobBySlug(slug, preview), getSiteSettings()]);
  if (!job) notFound();

  const responsibilities = asArray<string>(job.responsibilities);
  const requirements = asArray<string>(job.requirements);
  const benefits = asArray<string>(job.benefits);

  const salary =
    job.showSalary && job.salaryMin
      ? `${job.salaryCurrency ?? "INR"} ${job.salaryMin.toLocaleString("en-IN")}${
          job.salaryMax ? ` – ${job.salaryMax.toLocaleString("en-IN")}` : ""
        }`
      : null;

  return (
    <>
      {preview ? (
        <PreviewBanner
          status={job.status}
          editHref={`/admin/careers/${job.id}`}
        />
      ) : null}

      <JsonLdScript
        data={jobPostingSchema({
          title: job.title,
          description: job.description,
          slug: job.slug,
          department: job.department,
          location: job.location,
          workMode: job.workMode,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryCurrency: job.salaryCurrency,
          showSalary: job.showSalary,
          publishedAt: job.publishedAt,
          closesAt: job.closesAt,
          companyName: settings.legalName,
          addressLocality: settings.addressLocality,
          addressCountry: settings.addressCountry,
        })}
      />
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
          { name: job.title, href: `/careers/${job.slug}` },
        ])}
      />

      <PageHero
        eyebrow={job.department}
        title={job.title}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
          { name: job.title, href: `/careers/${job.slug}` },
        ]}
      >
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-200">
          <li className="flex items-center gap-1.5">
            <MapPin className="size-4 text-ink-400" />
            {job.location} · {WORK_MODE_LABEL[job.workMode]}
          </li>
          <li className="flex items-center gap-1.5">
            <Clock className="size-4 text-ink-400" />
            {EMPLOYMENT_LABEL[job.employmentType]}
          </li>
          {job.experience ? (
            <li className="flex items-center gap-1.5">
              <Building2 className="size-4 text-ink-400" />
              {job.experience}
            </li>
          ) : null}
          {salary ? (
            <li className="flex items-center gap-1.5">
              <Wallet className="size-4 text-ink-400" />
              {salary}
            </li>
          ) : null}
        </ul>
      </PageHero>

      <SectionShell>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <div className="space-y-4 text-[16px] leading-relaxed text-ink-200">
              {job.description.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {responsibilities.length ? (
              <section className="mt-12">
                <h2 className="text-[20px] font-medium tracking-tight text-ink-50">
                  What you will do
                </h2>
                <ul className="mt-5 space-y-3">
                  {responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      <span className="text-[15px] leading-relaxed text-ink-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {requirements.length ? (
              <section className="mt-12">
                <h2 className="text-[20px] font-medium tracking-tight text-ink-50">
                  What we are looking for
                </h2>
                <ul className="mt-5 space-y-3">
                  {requirements.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      <span className="text-[15px] leading-relaxed text-ink-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {benefits.length ? (
              <section className="mt-12">
                <h2 className="text-[20px] font-medium tracking-tight text-ink-50">
                  What we offer
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {benefits.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl border border-white/8 px-4 py-3 text-[14.5px] text-ink-200"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-28 lg:h-fit">
            <JobApplicationForm
              jobId={job.id}
              jobTitle={job.title}
              applyEmail={job.applyEmail ?? settings.email}
              applyUrl={job.applyUrl}
            />
          </div>
        </div>
      </SectionShell>
    </>
  );
}
