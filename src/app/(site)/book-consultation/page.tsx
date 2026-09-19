import type { Metadata } from "next";
import { CalendarClock, MessageSquare, Route, Users } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { ContactForm } from "@/components/site/contact-form";
import { JsonLdScript } from "@/components/site/json-ld";
import { Reveal } from "@/components/ui/reveal";
import { getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

const AGENDA = [
  {
    icon: MessageSquare,
    title: "What you are trying to change",
    description: "The outcome you need, the constraints around it, and what has been tried already.",
  },
  {
    icon: Route,
    title: "The shortest credible route",
    description: "Where we would start, what the first milestone looks like, and what it depends on.",
  },
  {
    icon: Users,
    title: "Who would do the work",
    description: "The shape of the team, how we work together, and how handover happens.",
  },
  {
    icon: CalendarClock,
    title: "Timeline and budget reality",
    description: "An honest range — including whether the project should be smaller than planned.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Book a consultation",
    description:
      "A 30-minute conversation about your project: the outcome, the route to it, and an honest view of timeline and budget.",
    path: "/book-consultation",
  });
}

export default async function BookConsultationPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Book a consultation", href: "/book-consultation" },
        ])}
      />

      <PageHero
        eyebrow="Consultation"
        title="Thirty minutes,"
        highlight="no sales script."
        description="A working conversation with the people who would actually build the system. You leave with a clearer view of the route — whether or not you work with us."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Book a consultation", href: "/book-consultation" },
        ]}
      />

      <SectionShell>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <h2 className="text-[20px] font-medium tracking-tight text-ink-50">
              What we will cover
            </h2>
            <ul className="mt-7 space-y-6">
              {AGENDA.map((item, index) => (
                <Reveal as="li" key={item.title} delay={index * 0.06}>
                  <div className="flex items-start gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-[var(--accent)]">
                      <item.icon className="size-4" strokeWidth={1.6} />
                    </span>
                    <div>
                      <h3 className="text-[15.5px] font-medium text-ink-50">{item.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>

            {settings.email ? (
              <p className="mt-9 rounded-xl border border-white/8 bg-white/[0.02] p-5 text-[13.5px] leading-relaxed text-ink-300">
                Prefer email? Write to{" "}
                <a
                  href={`mailto:${settings.email}`}
                  className="text-ink-100 underline-offset-4 hover:underline"
                >
                  {settings.email}
                </a>{" "}
                and we will reply with times.
              </p>
            ) : null}
          </div>

          <ContactForm />
        </div>
      </SectionShell>
    </>
  );
}
