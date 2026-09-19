import { Accordion } from "@/components/ui/accordion";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { JsonLdScript } from "@/components/site/json-ld";
import { getFaqs } from "@/lib/queries";
import { faqSchema } from "@/lib/seo";
import type { BlockSettings, FaqItem } from "@/types";

export async function FaqBlock({
  content,
  settings,
}: {
  content: {
    eyebrow?: string;
    title?: string;
    description?: string;
    category?: string;
    items?: FaqItem[];
    limit?: number;
  };
  settings?: BlockSettings;
}) {
  // Inline items win; otherwise pull the shared FAQ library from the CMS.
  const inline = (content.items ?? []).filter((item) => item?.question && item?.answer);
  const items = inline.length
    ? inline
    : (await getFaqs(content.category)).map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      }));

  const limited = items.slice(0, content.limit ?? 12);
  if (!limited.length) return null;

  return (
    <SectionShell settings={settings}>
      <JsonLdScript data={faqSchema(limited)} />
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <SectionHeading
          eyebrow={content.eyebrow ?? "FAQ"}
          title={content.title ?? "Questions, answered"}
          description={content.description}
          className="lg:flex-col lg:items-start"
        />
        <Accordion items={limited} />
      </div>
    </SectionShell>
  );
}
