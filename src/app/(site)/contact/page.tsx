import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { FaqBlock } from "@/components/sections/faq";
import { ContactForm } from "@/components/site/contact-form";
import { JsonLdScript } from "@/components/site/json-ld";
import { getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ service?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Contact",
    description:
      "Tell us what you are trying to build. We reply with a clear route, an honest timeline and the team who would deliver it.",
    path: "/contact",
  });
}

export default async function ContactPage({ searchParams }: Props) {
  const [{ service }, settings] = await Promise.all([searchParams, getSiteSettings()]);

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ])}
      />

      <PageHero
        eyebrow="Contact"
        title="Let's build something"
        highlight="extraordinary."
        description="Four short steps. Tell us who you are, what you want to build, and what success looks like — we take it from there."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <SectionShell>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <h2 className="text-[20px] font-medium tracking-tight text-ink-50">
              Talk to us directly
            </h2>
            <ul className="mt-6 space-y-4">
              {settings.email ? (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="group flex items-start gap-3.5 rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:border-white/20"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-[var(--accent)]">
                      <Mail className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] uppercase tracking-[0.16em] text-ink-400">
                        Email
                      </span>
                      <span className="mt-0.5 block truncate text-[14.5px] text-ink-50">
                        {settings.email}
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}

              {settings.phone ? (
                <li>
                  <a
                    href={`tel:${settings.phone.replace(/\s/g, "")}`}
                    className="group flex items-start gap-3.5 rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:border-white/20"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-[var(--accent)]">
                      <Phone className="size-4" />
                    </span>
                    <span>
                      <span className="block text-[12px] uppercase tracking-[0.16em] text-ink-400">
                        Phone
                      </span>
                      <span className="mt-0.5 block text-[14.5px] text-ink-50">{settings.phone}</span>
                    </span>
                  </a>
                </li>
              ) : null}

              {settings.address ? (
                <li className="flex items-start gap-3.5 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-[var(--accent)]">
                    <MapPin className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[12px] uppercase tracking-[0.16em] text-ink-400">
                      Office
                    </span>
                    <span className="mt-0.5 block text-[14.5px] leading-relaxed text-ink-100">
                      {settings.address}
                    </span>
                  </span>
                </li>
              ) : null}

              <li className="flex items-start gap-3.5 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-[var(--accent)]">
                  <Clock className="size-4" />
                </span>
                <span>
                  <span className="block text-[12px] uppercase tracking-[0.16em] text-ink-400">
                    Response time
                  </span>
                  <span className="mt-0.5 block text-[14.5px] text-ink-100">
                    Within one business day
                  </span>
                </span>
              </li>
            </ul>

            <p className="mt-8 flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-400">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-500" />
              Your details are used only to respond to this enquiry. We do not sell or share contact
              information, and we will sign an NDA before detailed discussions.
            </p>
          </div>

          <ContactForm defaultService={service} />
        </div>
      </SectionShell>

      <FaqBlock
        content={{ title: "Before you write", limit: 5 }}
        settings={{ background: "subtle" }}
      />
    </>
  );
}
