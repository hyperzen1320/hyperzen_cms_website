import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { HeroVisual } from "@/components/site/hero-visual";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal, TextReveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export type HeroContent = {
  eyebrow?: string;
  headline?: string;
  highlight?: string;
  subtitle?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  badges?: string[];
  visual?: "lattice" | "none";
};

export function HeroBlock({ content }: { content: HeroContent }) {
  const headline = content.headline || "Empowering Future Enterprises.";
  const badges = content.badges?.filter(Boolean) ?? [];

  return (
    <section className="relative isolate overflow-hidden pb-20 pt-14 md:pb-28 md:pt-20 xl:pb-36 xl:pt-24">
      {/* Background layers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-lines opacity-[0.55] mask-fade-b" />
        <div
          className="absolute left-1/2 top-[-18rem] size-[52rem] -translate-x-1/2 rounded-full opacity-[0.18] blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, var(--accent), color-mix(in oklab, var(--accent-2) 65%, transparent) 50%, transparent 70%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
          <div className="max-w-2xl">
            {content.eyebrow ? (
              <Reveal direction="none">
                <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-4 text-[12.5px] text-ink-100">
                  <span className="relative flex size-5 items-center justify-center">
                    <span className="absolute inline-flex size-2 animate-[pulse-ring_3.2s_ease-out_infinite] rounded-full bg-[var(--accent)]" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[var(--accent)]" />
                  </span>
                  {content.eyebrow}
                </p>
              </Reveal>
            ) : null}

            <h1 className="text-[clamp(2.6rem,6.4vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink-50">
              <TextReveal text={headline} />
              {content.highlight ? (
                <>
                  {" "}
                  <span className="text-accent-gradient">
                    <TextReveal text={content.highlight} delay={0.25} />
                  </span>
                </>
              ) : null}
            </h1>

            {content.subtitle ? (
              <Reveal delay={0.35}>
                <p className="mt-5 text-[17px] font-medium text-ink-100 md:text-[19px]">
                  {content.subtitle}
                </p>
              </Reveal>
            ) : null}

            {content.description ? (
              <Reveal delay={0.42}>
                <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-200 md:text-[17px]">
                  {content.description}
                </p>
              </Reveal>
            ) : null}

            <Reveal delay={0.5}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {content.ctaLabel ? (
                  <Magnetic strength={0.2}>
                    <Link
                      href={content.ctaUrl || "/contact"}
                      className="group inline-flex h-13 items-center gap-2.5 rounded-full bg-ink-50 px-7 text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_18px_50px_-18px_rgba(255,255,255,0.65)]"
                    >
                      {content.ctaLabel}
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Magnetic>
                ) : null}

                {content.secondaryCtaLabel ? (
                  <Link
                    href={content.secondaryCtaUrl || "/projects"}
                    className="group inline-flex h-13 items-center gap-2.5 rounded-full border border-white/14 px-7 text-[15px] font-medium text-ink-50 transition-colors duration-300 hover:border-white/32 hover:bg-white/[0.05]"
                  >
                    <Play className="size-3.5 fill-current" />
                    {content.secondaryCtaLabel}
                  </Link>
                ) : null}
              </div>
            </Reveal>

            {badges.length ? (
              <Reveal delay={0.58}>
                <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/8 pt-6">
                  {badges.map((badge) => (
                    <li
                      key={badge}
                      className="flex items-center gap-2 text-[13px] text-ink-300"
                    >
                      <span className="size-1 rounded-full bg-[var(--accent)]" />
                      {badge}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>

          {content.visual !== "none" ? (
            <div className="relative">
              <div
                className={cn(
                  "relative aspect-square w-full overflow-hidden rounded-3xl border border-white/8",
                  "bg-[radial-gradient(120%_120%_at_50%_0%,rgba(255,255,255,0.05),transparent_55%)]",
                )}
              >
                <HeroVisual className="absolute inset-0" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                  <div className="rounded-xl border border-white/8 bg-ink-950/70 px-3.5 py-2.5 backdrop-blur-md">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-400">
                      System
                    </p>
                    <p className="mt-0.5 text-[13px] font-medium text-ink-50">
                      Architecture · AI · Automation
                    </p>
                  </div>
                  <div className="hidden rounded-xl border border-white/8 bg-ink-950/70 px-3.5 py-2.5 backdrop-blur-md sm:block">
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-400">
                      Status
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-50">
                      <span className="size-1.5 rounded-full bg-success" />
                      Operational
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
