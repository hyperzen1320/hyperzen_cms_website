/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, Quote, Star } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { SpotlightCard } from "@/components/ui/spotlight";
import { asArray, cn, formatDate } from "@/lib/utils";
import type {
  BlogPost,
  Category,
  Industry,
  Product,
  Project,
  Service,
  Solution,
  Testimonial,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export function ServiceCard({ service, size = "md" }: { service: Service; size?: "md" | "lg" }) {
  const features = asArray<string | { title: string }>(service.features).slice(0, 3);

  return (
    <SpotlightCard as="article" className="h-full">
      <Link href={`/services/${service.slug}`} className="flex h-full flex-col p-7">
        <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--accent)]">
          <Icon name={service.icon} className="size-5" />
        </span>

        <h3
          className={cn(
            "mt-6 font-medium tracking-tight text-ink-50",
            size === "lg" ? "text-[21px]" : "text-[18px]",
          )}
        >
          {service.title}
        </h3>
        <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-300">{service.shortDesc}</p>

        {features.length ? (
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {features.map((feature, index) => {
              const label = typeof feature === "string" ? feature : feature.title;
              if (!label) return null;
              return (
                <li
                  key={`${label}-${index}`}
                  className="rounded-full border border-white/8 px-2.5 py-1 text-[11.5px] text-ink-300"
                >
                  {label}
                </li>
              );
            })}
          </ul>
        ) : null}

        <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-100 transition-colors group-hover/spot:text-ink-50">
          Explore service
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover/spot:translate-x-0.5 group-hover/spot:-translate-y-0.5" />
        </span>
      </Link>
    </SpotlightCard>
  );
}

// ---------------------------------------------------------------------------
// Solution
// ---------------------------------------------------------------------------

export function SolutionCard({ solution }: { solution: Solution }) {
  return (
    <SpotlightCard as="article" className="h-full">
      <Link href={`/solutions/${solution.slug}`} className="flex h-full flex-col p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[var(--accent)]">
            <Icon name={solution.icon} className="size-5" />
          </span>
          <ArrowUpRight className="size-4 text-ink-500 transition-all duration-300 group-hover/spot:translate-x-0.5 group-hover/spot:-translate-y-0.5 group-hover/spot:text-ink-100" />
        </div>
        <h3 className="mt-6 text-[18px] font-medium tracking-tight text-ink-50">{solution.title}</h3>
        <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-300">{solution.shortDesc}</p>
      </Link>
    </SpotlightCard>
  );
}

// ---------------------------------------------------------------------------
// Industry
// ---------------------------------------------------------------------------

export function IndustryCard({ industry }: { industry: Industry }) {
  return (
    <Link
      href={`/industries/${industry.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-7 transition-all duration-500 hover:border-white/18 hover:bg-white/[0.045]"
    >
      <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 text-[var(--accent)] transition-transform duration-500 group-hover:scale-105">
        <Icon name={industry.icon} className="size-5" />
      </span>
      <h3 className="mt-6 text-[18px] font-medium tracking-tight text-ink-50">{industry.name}</h3>
      <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-300">{industry.shortDesc}</p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-200 transition-colors group-hover:text-ink-50">
        View industry
        <ArrowUpRight className="size-4" />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-transparent transition-transform duration-500 group-hover:scale-x-100"
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

const PRODUCT_STATUS_LABEL: Record<string, string> = {
  CONCEPT: "Concept",
  IN_DEVELOPMENT: "In development",
  BETA: "Beta",
  LIVE: "Live",
  SUNSET: "Sunset",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <SpotlightCard as="article" className="h-full">
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/8 bg-ink-900">
          {product.coverUrl ? (
            <img
              src={product.coverUrl}
              alt={product.name}
              className="size-full object-cover transition-transform duration-700 group-hover/spot:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0">
              <div className="absolute inset-0 grid-lines opacity-40" />
              <div
                className="absolute inset-0 opacity-20 blur-2xl"
                style={{ background: "radial-gradient(60% 60% at 50% 40%, var(--accent), transparent 70%)" }}
              />
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full border border-white/12 bg-ink-950/75 px-2.5 py-1 text-[11px] font-medium text-ink-100 backdrop-blur">
            {PRODUCT_STATUS_LABEL[product.productStatus] ?? product.productStatus}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-3">
            {product.logoUrl ? (
              <img
                src={product.logoUrl}
                alt=""
                className="size-8 rounded-lg object-contain"
                loading="lazy"
              />
            ) : null}
            <h3 className="text-[18px] font-medium tracking-tight text-ink-50">{product.name}</h3>
          </div>
          {product.tagline ? (
            <p className="mt-1.5 text-[13px] text-[var(--accent)]">{product.tagline}</p>
          ) : null}
          <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-300">
            {product.description}
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-100">
            View product
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover/spot:translate-x-0.5 group-hover/spot:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </SpotlightCard>
  );
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export function ProjectCard({
  project,
  featured = false,
}: {
  project: Project & { industry?: Industry | null; services?: Service[] };
  featured?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all duration-500 hover:border-white/18",
        featured && "lg:col-span-2",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-ink-900",
          featured ? "aspect-[16/9]" : "aspect-[4/3]",
        )}
      >
        {project.coverUrl ? (
          <img
            src={project.coverUrl}
            alt={project.title}
            className="size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 grid-lines opacity-40" />
            <div
              className="absolute inset-0 opacity-[0.18] blur-3xl"
              style={{
                background: "radial-gradient(60% 60% at 40% 40%, var(--accent), transparent 70%)",
              }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent opacity-90" />
      </div>

      <div className="relative flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink-300">
          {project.industry ? (
            <span className="rounded-full border border-white/10 px-2.5 py-1">
              {project.industry.name}
            </span>
          ) : null}
          {project.year ? <span className="font-mono text-ink-400">{project.year}</span> : null}
        </div>

        <h3
          className={cn(
            "mt-4 font-medium tracking-tight text-ink-50",
            featured ? "text-[24px]" : "text-[19px]",
          )}
        >
          {project.title}
        </h3>
        {project.clientName ? (
          <p className="mt-1 text-[13px] text-ink-400">{project.clientName}</p>
        ) : null}
        <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-300">{project.summary}</p>

        <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-100 transition-colors group-hover:text-ink-50">
          Read case study
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Insight
// ---------------------------------------------------------------------------

export function PostCard({
  post,
  featured = false,
}: {
  post: BlogPost & { category?: Category | null };
  featured?: boolean;
}) {
  return (
    <Link
      href={`/insights/${post.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] transition-all duration-500 hover:border-white/18 hover:bg-white/[0.04]",
        featured && "md:col-span-2 md:flex-row",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-ink-900",
          featured ? "aspect-[16/10] md:aspect-auto md:w-1/2" : "aspect-[16/10]",
        )}
      >
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt={post.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 grid-lines opacity-40" />
            <div
              className="absolute inset-0 opacity-[0.16] blur-3xl"
              style={{ background: "radial-gradient(50% 50% at 50% 50%, var(--accent), transparent 70%)" }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-[11.5px] text-ink-400">
          {post.category ? (
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-ink-200">
              {post.category.name}
            </span>
          ) : null}
          <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          <span>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>

        <h3
          className={cn(
            "mt-4 font-medium leading-snug tracking-tight text-ink-50",
            featured ? "text-[24px]" : "text-[18px]",
          )}
        >
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-ink-300">{post.excerpt}</p>
        ) : null}

        <span className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-100">
          Read article
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Testimonial
// ---------------------------------------------------------------------------

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-7">
      <Quote className="size-6 text-[var(--accent)] opacity-70" />
      <blockquote className="mt-5 flex-1 text-[15.5px] leading-relaxed text-ink-100">
        “{testimonial.quote}”
      </blockquote>

      {testimonial.rating ? (
        <div className="mt-6 flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={cn(
                "size-3.5",
                index < (testimonial.rating ?? 0)
                  ? "fill-[var(--accent)] text-[var(--accent)]"
                  : "text-ink-500",
              )}
            />
          ))}
        </div>
      ) : null}

      <figcaption className="mt-5 flex items-center gap-3 border-t border-white/8 pt-5">
        {testimonial.photoUrl ? (
          <img
            src={testimonial.photoUrl}
            alt=""
            className="size-10 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="grid size-10 place-items-center rounded-full border border-white/10 text-[13px] font-medium text-ink-200">
            {testimonial.clientName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-ink-50">
            {testimonial.clientName}
          </span>
          <span className="block truncate text-[12.5px] text-ink-400">
            {[testimonial.designation, testimonial.company].filter(Boolean).join(", ")}
          </span>
        </span>

        {testimonial.companyLogo ? (
          <img
            src={testimonial.companyLogo}
            alt={testimonial.company ?? ""}
            className="h-6 w-auto max-w-[92px] shrink-0 object-contain opacity-70"
            loading="lazy"
          />
        ) : null}
      </figcaption>
    </figure>
  );
}
