import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { BlockSettings } from "@/types";

const SPACING: Record<NonNullable<BlockSettings["spacing"]>, string> = {
  compact: "py-14 md:py-20",
  normal: "py-20 md:py-28 xl:py-32",
  spacious: "py-28 md:py-36 xl:py-44",
};

const WIDTH: Record<NonNullable<BlockSettings["width"]>, string> = {
  narrow: "max-w-3xl",
  default: "",
  wide: "max-w-[96rem]",
};

/** Wraps every page-builder block with its CMS-controlled background and spacing. */
export function SectionShell({
  settings,
  className,
  children,
  id,
}: {
  settings?: BlockSettings;
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const background = settings?.background ?? "none";
  const spacing = settings?.spacing ?? "normal";

  return (
    <section
      id={id}
      className={cn("relative isolate overflow-hidden", SPACING[spacing], className)}
    >
      {background === "subtle" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/[0.035] to-transparent"
        />
      ) : null}

      {background === "grid" ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 grid-lines opacity-60 mask-fade-b" />
        </div>
      ) : null}

      {background === "gradient" ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-0 size-[46rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.16] blur-[120px]"
            style={{
              background:
                "radial-gradient(circle, var(--accent), color-mix(in oklab, var(--accent-2) 60%, transparent) 55%, transparent 72%)",
            }}
          />
        </div>
      ) : null}

      <div className={cn("container-page", settings?.width ? WIDTH[settings.width] : "")}>
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  level = "h2",
}: {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  align?: "left" | "center";
  action?: { label: string; href: string } | null;
  className?: string;
  level?: "h1" | "h2" | "h3";
}) {
  const Heading = level;

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn(align === "center" ? "max-w-3xl" : "max-w-2xl")}>
        {eyebrow ? (
          <Reveal>
            <p className="mb-4 flex items-center gap-2.5 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              <span className="inline-block h-px w-6 bg-[var(--accent)] opacity-60" />
              {eyebrow}
            </p>
          </Reveal>
        ) : null}
        <Reveal delay={0.05}>
          <Heading
            className={cn(
              "font-semibold leading-[1.08] tracking-tight text-ink-50",
              level === "h1"
                ? "text-[clamp(2.4rem,6vw,4.5rem)]"
                : "text-[clamp(1.9rem,3.6vw,3.1rem)]",
            )}
          >
            {title}
          </Heading>
        </Reveal>
        {description ? (
          <Reveal delay={0.1}>
            <p
              className={cn(
                "mt-5 text-[16px] leading-relaxed text-ink-200 md:text-[17px]",
                align === "center" && "mx-auto",
              )}
            >
              {description}
            </p>
          </Reveal>
        ) : null}
      </div>

      {action ? (
        <Reveal delay={0.15} className={cn(align === "center" && "mt-2")}>
          <Link
            href={action.href}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-[13.5px] font-medium text-ink-50 transition-colors duration-300 hover:border-white/30 hover:bg-white/[0.05]"
          >
            {action.label}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      ) : null}
    </div>
  );
}
