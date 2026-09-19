import { Counter } from "@/components/ui/counter";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionShell } from "@/components/sections/section-shell";
import type { BlockSettings, Metric } from "@/types";

export type StatsContent = {
  eyebrow?: string;
  title?: string;
  items?: Metric[];
};

/**
 * Credibility metrics. Every value is CMS-managed — nothing is hard-coded — and
 * the whole block can be hidden until the business has verified numbers.
 */
export function StatsBlock({
  content,
  settings,
}: {
  content: StatsContent;
  settings?: BlockSettings;
}) {
  const items = (content.items ?? []).filter((item) => item?.value && item?.label);
  if (!items.length) return null;

  return (
    <SectionShell settings={{ spacing: "compact", ...settings }}>
      {content.title ? (
        <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-ink-200">{content.title}</p>
      ) : null}

      <RevealGroup
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.06] lg:grid-cols-4"
        as="ul"
      >
        {items.map((item) => (
          <RevealItem
            key={`${item.label}-${item.value}`}
            as="li"
            className="group relative bg-ink-950 px-6 py-8 transition-colors duration-500 hover:bg-ink-900 sm:px-8 sm:py-10"
          >
            <p className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-tight text-ink-50">
              <Counter value={item.value} />
            </p>
            <p className="mt-3 text-[13.5px] font-medium text-ink-100">{item.label}</p>
            {item.description ? (
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-400">{item.description}</p>
            ) : null}
            <span
              aria-hidden="true"
              className="absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-[var(--accent)] to-transparent transition-transform duration-500 group-hover:scale-x-100"
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}
