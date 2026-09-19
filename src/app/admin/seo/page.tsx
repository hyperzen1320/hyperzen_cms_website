import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSeoSettings } from "@/lib/queries";
import { Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { saveSeoSettingsAction } from "@/app/admin/settings/actions";
import type { Field } from "@/lib/admin/fields";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "SEO" };

const FIELDS: Field[] = [
  { name: "siteTitle", label: "Default site title", type: "text", group: "Defaults", required: true },
  {
    name: "titleTemplate",
    label: "Title template",
    type: "text",
    group: "Defaults",
    help: "Use %s where the page title should appear, for example: %s — Hyperzen Innovation",
  },
  {
    name: "metaDescription",
    label: "Default meta description",
    type: "textarea",
    rows: 3,
    group: "Defaults",
  },
  {
    name: "keywords",
    label: "Keywords",
    type: "text",
    group: "Defaults",
    help: "Comma separated. A minor ranking signal, but useful as an internal reference.",
  },

  { name: "ogImage", label: "Default social image", type: "image", group: "Social" },
  {
    name: "twitterHandle",
    label: "X / Twitter handle",
    type: "text",
    group: "Social",
    width: "half",
    placeholder: "@hyperzen",
  },
  {
    name: "twitterCardType",
    label: "Card type",
    type: "select",
    group: "Social",
    width: "half",
    options: [
      { label: "Large image", value: "summary_large_image" },
      { label: "Summary", value: "summary" },
    ],
  },

  {
    name: "robotsIndex",
    label: "Allow indexing",
    type: "switch",
    group: "Robots",
    width: "half",
    help: "Turn this off on staging so search engines skip the site entirely.",
  },
  { name: "robotsFollow", label: "Allow link following", type: "switch", group: "Robots", width: "half" },

  { name: "googleVerification", label: "Google verification", type: "text", group: "Verification", width: "half" },
  { name: "bingVerification", label: "Bing verification", type: "text", group: "Verification", width: "half" },
];

export default async function SeoSettingsPage() {
  const user = await requireUser();
  if (!can(user.role, "website.write")) notFound();

  const seo = await getSeoSettings();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="SEO"
        description="Site-wide defaults. Individual pages and content types override the title, description and social image."
      />

      <SettingsForm
        fields={FIELDS}
        action={saveSeoSettingsAction}
        values={{
          siteTitle: seo.siteTitle,
          titleTemplate: seo.titleTemplate,
          metaDescription: seo.metaDescription,
          keywords: seo.keywords ?? "",
          ogImage: seo.ogImage ?? "",
          twitterHandle: seo.twitterHandle ?? "",
          twitterCardType: seo.twitterCardType,
          robotsIndex: seo.robotsIndex,
          robotsFollow: seo.robotsFollow,
          googleVerification: seo.googleVerification ?? "",
          bingVerification: seo.bingVerification ?? "",
        }}
      >
        <Card className="mb-4">
          <CardTitle
            title="Generated automatically"
            description="These stay in step with published content — nothing to configure."
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "sitemap.xml", href: "/sitemap.xml" },
              { label: "robots.txt", href: "/robots.txt" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-[var(--a-border)] px-3.5 py-2.5 text-[13.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)]"
                >
                  {item.label}
                  <ExternalLink className="size-3.5 text-[var(--a-subtle)]" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--a-muted)]">
            Structured data — Organization, WebSite, Service, Article, BreadcrumbList, FAQPage and
            JobPosting — is emitted automatically from the content you publish.
          </p>
        </Card>
      </SettingsForm>
    </div>
  );
}
