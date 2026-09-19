import { ContactForm } from "@/components/site/contact-form";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import type { BlockSettings } from "@/types";

export function ContactFormBlock({
  content,
  settings,
}: {
  content: {
    eyebrow?: string;
    title?: string;
    description?: string;
    defaultService?: string;
  };
  settings?: BlockSettings;
}) {
  return (
    <SectionShell settings={settings}>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        <SectionHeading
          eyebrow={content.eyebrow ?? "Contact"}
          title={content.title ?? "Let's build something extraordinary."}
          description={
            content.description ??
            "Share the outcome you are aiming for. We will reply with a clear route, an honest timeline and the team who would deliver it."
          }
          className="lg:flex-col lg:items-start"
        />
        <ContactForm defaultService={content.defaultService} />
      </div>
    </SectionShell>
  );
}
