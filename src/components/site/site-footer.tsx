import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { SocialIcon } from "@/components/site/social-icon";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { getNavigation, getSiteSettings } from "@/lib/queries";
import { asArray } from "@/lib/utils";
import type { SocialLink } from "@/types";

const COLUMNS: { key: string; title: string }[] = [
  { key: "FOOTER_SERVICES", title: "Services" },
  { key: "FOOTER_COMPANY", title: "Company" },
  { key: "FOOTER_RESOURCES", title: "Resources" },
];

export async function SiteFooter() {
  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()]);
  const socials = asArray<SocialLink>(settings.socialLinks);
  const legal = navigation.FOOTER_LEGAL ?? [];

  return (
    <footer className="relative mt-24 border-t border-white/8 bg-ink-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[color-mix(in_oklab,var(--accent)_50%,transparent)] to-transparent"
      />

      {/* Closing CTA */}
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.06] to-transparent px-6 py-12 sm:px-12 sm:py-16 -mt-24 backdrop-blur-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--accent) 45%, transparent), transparent 70%)",
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <h2 className="max-w-xl text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.08] tracking-tight text-ink-50">
                {settings.footerCtaTitle || "Let's build something extraordinary."}
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-200">
                {settings.footerCtaText ||
                  "Tell us what you are trying to build. We will come back with a clear route, an honest timeline, and the team to deliver it."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={settings.footerCtaUrl || settings.primaryCtaUrl}
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-ink-50 px-6 text-[14.5px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_16px_48px_-16px_rgba(255,255,255,0.6)]"
              >
                {settings.footerCtaLabel || settings.primaryCtaLabel}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/book-consultation"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-[14.5px] font-medium text-ink-50 transition-colors duration-300 hover:border-white/35 hover:bg-white/[0.05]"
              >
                Book a consultation
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page pb-10 pt-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_2.5fr]">
          <div className="max-w-sm">
            <Logo url={settings.logoUrl} companyName={settings.companyName} />
            <p className="mt-5 text-[14px] leading-relaxed text-ink-200">
              {settings.footerDescription || settings.description || settings.tagline}
            </p>

            <div className="mt-6 space-y-2.5 text-[14px]">
              {settings.email ? (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-2.5 text-ink-100 transition-colors hover:text-ink-50"
                >
                  <Mail className="size-4 text-ink-400" />
                  {settings.email}
                </a>
              ) : null}
              {settings.phone ? (
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 text-ink-100 transition-colors hover:text-ink-50"
                >
                  <Phone className="size-4 text-ink-400" />
                  {settings.phone}
                </a>
              ) : null}
              {settings.address ? (
                <p className="flex items-start gap-2.5 text-ink-200">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-ink-400" />
                  <span>{settings.address}</span>
                </p>
              ) : null}
            </div>

            {socials.length ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <li key={social.url}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-ink-200 transition-colors duration-300 hover:border-white/30 hover:text-ink-50"
                    >
                      <SocialIcon name={social.icon || social.label} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.9fr] lg:gap-8">
            {COLUMNS.map((column) => {
              const links = navigation[column.key] ?? [];
              if (!links.length) return null;
              return (
                <div key={column.key}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {links.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={link.href}
                          target={link.openInNewTab ? "_blank" : undefined}
                          rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                          className="text-[14px] text-ink-200 transition-colors duration-300 hover:text-ink-50"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">
                {settings.newsletterTitle || "Newsletter"}
              </h3>
              <p className="mt-4 text-[13.5px] leading-relaxed text-ink-200">
                {settings.newsletterText ||
                  "Occasional notes on engineering, AI and building digital products."}
              </p>
              <div className="mt-4">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
          <p className="text-[13px] text-ink-400">
            {settings.copyright ||
              `© ${new Date().getFullYear()} ${settings.legalName}. All rights reserved.`}
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {(legal.length
              ? legal
              : [
                  { id: "privacy", label: "Privacy Policy", href: "/privacy-policy" },
                  { id: "terms", label: "Terms", href: "/terms" },
                ]
            ).map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className="text-[13px] text-ink-400 transition-colors hover:text-ink-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
