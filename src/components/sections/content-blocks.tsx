/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Magnetic } from "@/components/ui/magnetic";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SpotlightCard } from "@/components/ui/spotlight";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { sanitizeRichText } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import type { BlockSettings, FeatureItem, ProcessStep } from "@/types";

type Base = { settings?: BlockSettings };

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export function TextBlock({
  content,
  settings,
}: Base & { content: { eyebrow?: string; title?: string; body?: string; align?: "left" | "center" } }) {
  if (!content.title && !content.body) return null;
  const align = content.align ?? settings?.align ?? "left";

  return (
    <SectionShell settings={settings}>
      <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
        {content.eyebrow ? (
          <Reveal>
            <p className="mb-4 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {content.eyebrow}
            </p>
          </Reveal>
        ) : null}
        {content.title ? (
          <Reveal delay={0.05}>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.9rem)] font-semibold leading-[1.1] tracking-tight text-ink-50">
              {content.title}
            </h2>
          </Reveal>
        ) : null}
        {content.body ? (
          <Reveal delay={0.1}>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-ink-200 md:text-[17px]">
              {content.body.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </Reveal>
        ) : null}
      </div>
    </SectionShell>
  );
}

export function RichTextBlock({ content, settings }: Base & { content: { html?: string } }) {
  if (!content.html) return null;
  return (
    <SectionShell settings={settings}>
      <div
        className="prose prose-invert prose-hyperzen mx-auto max-w-3xl prose-headings:tracking-tight prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(content.html) }}
      />
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export function ImageBlock({
  content,
  settings,
}: Base & { content: { url?: string; alt?: string; caption?: string } }) {
  if (!content.url) return null;
  return (
    <SectionShell settings={{ spacing: "compact", ...settings }}>
      <Reveal>
        <figure className="overflow-hidden rounded-2xl border border-white/8">
          <img
            src={content.url}
            alt={content.alt ?? ""}
            className="w-full object-cover"
            loading="lazy"
          />
          {content.caption ? (
            <figcaption className="border-t border-white/8 bg-white/[0.02] px-5 py-3 text-[13px] text-ink-300">
              {content.caption}
            </figcaption>
          ) : null}
        </figure>
      </Reveal>
    </SectionShell>
  );
}

export function VideoBlock({
  content,
  settings,
}: Base & { content: { url?: string; poster?: string; caption?: string } }) {
  if (!content.url) return null;
  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com/.test(content.url);

  return (
    <SectionShell settings={{ spacing: "compact", ...settings }}>
      <Reveal>
        <figure className="overflow-hidden rounded-2xl border border-white/8 bg-ink-900">
          <div className="aspect-video w-full">
            {isEmbed ? (
              <iframe
                src={toEmbedUrl(content.url)}
                title={content.caption ?? "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="size-full"
              />
            ) : (
              <video
                src={content.url}
                poster={content.poster}
                controls
                preload="metadata"
                playsInline
                className="size-full object-cover"
              />
            )}
          </div>
          {content.caption ? (
            <figcaption className="border-t border-white/8 px-5 py-3 text-[13px] text-ink-300">
              {content.caption}
            </figcaption>
          ) : null}
        </figure>
      </Reveal>
    </SectionShell>
  );
}

function toEmbedUrl(url: string): string {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

// ---------------------------------------------------------------------------
// Two column (about / narrative)
// ---------------------------------------------------------------------------

export function TwoColumnBlock({
  content,
  settings,
}: Base & {
  content: {
    eyebrow?: string;
    title?: string;
    body?: string;
    imageUrl?: string;
    imageAlt?: string;
    reverse?: boolean;
    bullets?: string[];
    ctaLabel?: string;
    ctaUrl?: string;
    cards?: FeatureItem[];
  };
}) {
  if (!content.title && !content.body) return null;

  return (
    <SectionShell settings={settings}>
      <div
        className={cn(
          "grid items-center gap-12 lg:grid-cols-2 lg:gap-16",
          content.reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div>
          {content.eyebrow ? (
            <Reveal>
              <p className="mb-4 flex items-center gap-2.5 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                <span className="inline-block h-px w-6 bg-[var(--accent)] opacity-60" />
                {content.eyebrow}
              </p>
            </Reveal>
          ) : null}
          {content.title ? (
            <Reveal delay={0.05}>
              <h2 className="text-[clamp(1.9rem,3.4vw,3rem)] font-semibold leading-[1.08] tracking-tight text-ink-50">
                {content.title}
              </h2>
            </Reveal>
          ) : null}
          {content.body ? (
            <Reveal delay={0.1}>
              <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-ink-200">
                {content.body.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          ) : null}

          {content.bullets?.length ? (
            <RevealGroup className="mt-8 space-y-3" as="ul">
              {content.bullets.filter(Boolean).map((bullet) => (
                <RevealItem as="li" key={bullet} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]">
                    <Check className="size-3 text-[var(--accent)]" />
                  </span>
                  <span className="text-[15px] leading-relaxed text-ink-100">{bullet}</span>
                </RevealItem>
              ))}
            </RevealGroup>
          ) : null}

          {content.ctaLabel ? (
            <Reveal delay={0.2}>
              <Link
                href={content.ctaUrl || "/contact"}
                className="group mt-9 inline-flex items-center gap-2 text-[14.5px] font-medium text-ink-50"
              >
                {content.ctaLabel}
                <span className="grid size-8 place-items-center rounded-full border border-white/15 transition-all duration-300 group-hover:border-white/40 group-hover:bg-white/[0.06]">
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </Reveal>
          ) : null}
        </div>

        <Reveal direction="left" delay={0.1}>
          {content.imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-white/8">
              <img
                src={content.imageUrl}
                alt={content.imageAlt ?? ""}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : content.cards?.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {content.cards.map((card) => (
                <li key={card.title}>
                  <SpotlightCard className="h-full p-5">
                    <Icon name={card.icon} className="size-5 text-[var(--accent)]" />
                    <p className="mt-4 text-[15px] font-medium text-ink-50">{card.title}</p>
                    {card.description ? (
                      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-300">
                        {card.description}
                      </p>
                    ) : null}
                  </SpotlightCard>
                </li>
              ))}
            </ul>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/8">
              <div className="absolute inset-0 grid-lines opacity-50" />
              <div
                className="absolute inset-0 opacity-25 blur-2xl"
                style={{
                  background:
                    "radial-gradient(60% 60% at 40% 30%, var(--accent), transparent 70%)",
                }}
              />
            </div>
          )}
        </Reveal>
      </div>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Card grids
// ---------------------------------------------------------------------------

export function ThreeCardsBlock({
  content,
  settings,
}: Base & {
  content: { eyebrow?: string; title?: string; description?: string; items?: FeatureItem[] };
}) {
  const items = (content.items ?? []).filter((item) => item?.title);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      {content.title ? (
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
          className="mb-12"
        />
      ) : null}
      <RevealGroup className="grid gap-4 md:grid-cols-3" as="ul">
        {items.slice(0, 6).map((item) => (
          <RevealItem as="li" key={item.title}>
            <SpotlightCard className="h-full p-7">
              <Icon name={item.icon} className="size-6 text-[var(--accent)]" />
              <h3 className="mt-6 text-[18px] font-medium tracking-tight text-ink-50">
                {item.title}
              </h3>
              {item.description ? (
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-300">{item.description}</p>
              ) : null}
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

export function FeatureGridBlock({
  content,
  settings,
}: Base & {
  content: { eyebrow?: string; title?: string; description?: string; items?: FeatureItem[] };
}) {
  const items = (content.items ?? []).filter((item) => item?.title);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      {content.title ? (
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
          className="mb-12"
        />
      ) : null}
      <RevealGroup
        className="grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3"
        as="ul"
      >
        {items.map((item) => (
          <RevealItem
            as="li"
            key={item.title}
            className="group bg-ink-950 p-7 transition-colors duration-500 hover:bg-ink-900"
          >
            <Icon
              name={item.icon}
              className="size-5 text-ink-300 transition-colors duration-500 group-hover:text-[var(--accent)]"
            />
            <h3 className="mt-5 text-[16px] font-medium text-ink-50">{item.title}</h3>
            {item.description ? (
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink-300">{item.description}</p>
            ) : null}
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export function ProcessBlock({
  content,
  settings,
}: Base & {
  content: { eyebrow?: string; title?: string; description?: string; steps?: ProcessStep[] };
}) {
  const steps = (content.steps ?? []).filter((step) => step?.title);
  if (!steps.length) return null;

  return (
    <SectionShell settings={settings}>
      {content.title ? (
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
          className="mb-14"
        />
      ) : null}

      <ol className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-white/12 via-white/12 to-transparent lg:block"
        />
        {steps.map((step, index) => (
          <Reveal as="li" key={step.title} delay={index * 0.08} className="relative">
            <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-white/12 bg-ink-950 font-mono text-[13px] text-[var(--accent)]">
              {step.step || String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-[16.5px] font-medium text-ink-50">{step.title}</h3>
            {step.description ? (
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink-300">{step.description}</p>
            ) : null}
          </Reveal>
        ))}
      </ol>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Logo cloud
// ---------------------------------------------------------------------------

export function LogoCloudBlock({
  content,
  settings,
}: Base & { content: { title?: string; logos?: { name: string; url?: string }[] } }) {
  const logos = (content.logos ?? []).filter((logo) => logo?.name);
  if (!logos.length) return null;

  return (
    <SectionShell settings={{ spacing: "compact", ...settings }}>
      {content.title ? (
        <p className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.22em] text-ink-400">
          {content.title}
        </p>
      ) : null}
      <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        {logos.map((logo) => (
          <li key={logo.name} className="opacity-60 transition-opacity duration-300 hover:opacity-100">
            {logo.url ? (
              <img src={logo.url} alt={logo.name} className="h-7 w-auto object-contain" loading="lazy" />
            ) : (
              <span className="text-[15px] font-medium tracking-tight text-ink-200">{logo.name}</span>
            )}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------

export function CtaBlock({
  content,
  settings,
}: Base & {
  content: {
    title?: string;
    description?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    secondaryCtaLabel?: string;
    secondaryCtaUrl?: string;
  };
}) {
  if (!content.title) return null;

  return (
    <SectionShell settings={settings}>
      <div className="relative overflow-hidden rounded-3xl border border-white/8 px-6 py-14 text-center sm:px-14 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 grid-lines opacity-40" />
          <div
            className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
            style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
          />
        </div>

        <Reveal>
          <h2 className="mx-auto max-w-3xl text-[clamp(1.9rem,4vw,3.2rem)] font-semibold leading-[1.08] tracking-tight text-ink-50">
            {content.title}
          </h2>
        </Reveal>
        {content.description ? (
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ink-200">
              {content.description}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={0.16}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {content.ctaLabel ? (
              <Magnetic strength={0.18}>
                <Link
                  href={content.ctaUrl || "/contact"}
                  className="group inline-flex h-13 items-center gap-2.5 rounded-full bg-ink-50 px-7 text-[15px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_18px_50px_-18px_rgba(255,255,255,0.6)]"
                >
                  {content.ctaLabel}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Magnetic>
            ) : null}
            {content.secondaryCtaLabel ? (
              <Link
                href={content.secondaryCtaUrl || "/services"}
                className="inline-flex h-13 items-center rounded-full border border-white/14 px-7 text-[15px] font-medium text-ink-50 transition-colors duration-300 hover:border-white/35 hover:bg-white/[0.05]"
              >
                {content.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}
