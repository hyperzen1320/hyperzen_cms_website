import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Reveal, TextReveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; href: string };

/** Standard header used by every index and detail page outside the page builder. */
export function PageHero({
  eyebrow,
  title,
  highlight,
  description,
  breadcrumbs,
  children,
  align = "left",
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string | null;
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
  align?: "left" | "center";
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-white/8",
        compact ? "pb-12 pt-10 md:pb-16 md:pt-14" : "pb-16 pt-10 md:pb-24 md:pt-16",
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-lines opacity-40 mask-fade-b" />
        <div
          className="absolute left-1/2 top-[-22rem] size-[42rem] -translate-x-1/2 rounded-full opacity-[0.13] blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, var(--accent), color-mix(in oklab, var(--accent-2) 60%, transparent) 55%, transparent 72%)",
          }}
        />
      </div>

      <div className="container-page">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-ink-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-1">
                  {index > 0 ? <ChevronRight className="size-3.5 text-ink-500" /> : null}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-ink-200">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-ink-100">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
          {eyebrow ? (
            <Reveal>
              <p
                className={cn(
                  "mb-5 flex items-center gap-2.5 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]",
                  align === "center" && "justify-center",
                )}
              >
                <span className="inline-block h-px w-6 bg-[var(--accent)] opacity-60" />
                {eyebrow}
              </p>
            </Reveal>
          ) : null}

          <h1 className="text-[clamp(2.3rem,5.2vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink-50">
            <TextReveal text={title} />
            {highlight ? (
              <>
                {" "}
                <span className="text-accent-gradient">
                  <TextReveal text={highlight} delay={0.2} />
                </span>
              </>
            ) : null}
          </h1>

          {description ? (
            <Reveal delay={0.3}>
              <p className="mt-6 text-[16.5px] leading-relaxed text-ink-200 md:text-[18px]">
                {description}
              </p>
            </Reveal>
          ) : null}

          {children ? (
            <Reveal delay={0.4}>
              <div className={cn("mt-8 flex flex-wrap gap-3", align === "center" && "justify-center")}>
                {children}
              </div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
