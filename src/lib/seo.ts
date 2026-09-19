import "server-only";

import type { Metadata } from "next";
import { getSeoSettings, getSiteSettings } from "@/lib/queries";
import { absoluteUrl, truncate } from "@/lib/utils";

type BuildMetadataInput = {
  title?: string | null;
  description?: string | null;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  canonical?: string | null;
  titleAbsolute?: boolean;
  type?: "website" | "article";
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  authors?: string[];
};

/** Compose page metadata from the CMS-managed global SEO defaults. */
export async function buildMetadata(input: BuildMetadataInput = {}): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoSettings(), getSiteSettings()]);

  const title = input.title?.trim() || seo.siteTitle;
  const description = truncate(
    input.description?.trim() || seo.metaDescription || settings.description || settings.tagline,
    300,
  );
  const url = absoluteUrl(input.path ?? "/");
  const image = input.image || seo.ogImage || null;
  const robotsIndex = seo.robotsIndex && !input.noIndex;

  return {
    title: input.titleAbsolute ? { absolute: title } : title,
    description,
    keywords: seo.keywords ? seo.keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    metadataBase: new URL(absoluteUrl("/")),
    alternates: { canonical: input.canonical || url },
    robots: {
      index: robotsIndex,
      follow: seo.robotsFollow,
      googleBot: { index: robotsIndex, follow: seo.robotsFollow },
    },
    openGraph: {
      type: input.type ?? "website",
      title,
      description,
      url,
      siteName: settings.companyName,
      images: image ? [{ url: absoluteUrl(image), alt: title }] : undefined,
      ...(input.type === "article"
        ? {
            publishedTime: toIso(input.publishedTime),
            modifiedTime: toIso(input.modifiedTime),
            authors: input.authors,
          }
        : {}),
    },
    twitter: {
      card: (seo.twitterCardType as "summary_large_image") ?? "summary_large_image",
      title,
      description,
      site: seo.twitterHandle ?? undefined,
      images: image ? [absoluteUrl(image)] : undefined,
    },
    verification: {
      google: seo.googleVerification ?? undefined,
      other: seo.bingVerification ? { "msvalidate.01": seo.bingVerification } : undefined,
    },
  };
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

export type JsonLd = Record<string, unknown>;

export async function organizationSchema(): Promise<JsonLd> {
  const [settings, seo] = await Promise.all([getSiteSettings(), getSeoSettings()]);
  const socials = Array.isArray(settings.socialLinks)
    ? (settings.socialLinks as { url?: string }[]).map((item) => item?.url).filter(Boolean)
    : [];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}#organization`,
    name: settings.companyName,
    legalName: settings.legalName,
    url: absoluteUrl("/"),
    description: settings.description || seo.metaDescription,
    ...(settings.logoUrl ? { logo: absoluteUrl(settings.logoUrl) } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              telephone: settings.phone,
              contactType: "sales",
              email: settings.email || undefined,
              areaServed: "Worldwide",
              availableLanguage: ["en"],
            },
          ],
        }
      : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressLocality: settings.addressLocality ?? undefined,
            addressRegion: settings.addressRegion ?? undefined,
            postalCode: settings.postalCode ?? undefined,
            addressCountry: settings.addressCountry ?? "IN",
          },
        }
      : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  };
}

export async function websiteSchema(): Promise<JsonLd> {
  const settings = await getSiteSettings();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: settings.companyName,
    url: absoluteUrl("/"),
    publisher: { "@id": `${absoluteUrl("/")}#organization` },
  };
}

export function breadcrumbSchema(items: { name: string; href: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  slug: string;
  providerName: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.name,
    url: absoluteUrl(`/services/${input.slug}`),
    provider: { "@type": "Organization", name: input.providerName, url: absoluteUrl("/") },
    areaServed: "Worldwide",
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  slug: string;
  image?: string | null;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  authorName?: string | null;
  publisherName: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(`/insights/${input.slug}`),
    mainEntityOfPage: absoluteUrl(`/insights/${input.slug}`),
    ...(input.image ? { image: [absoluteUrl(input.image)] } : {}),
    datePublished: toIso(input.publishedAt),
    dateModified: toIso(input.updatedAt) ?? toIso(input.publishedAt),
    author: { "@type": input.authorName ? "Person" : "Organization", name: input.authorName || input.publisherName },
    publisher: { "@type": "Organization", name: input.publisherName, url: absoluteUrl("/") },
  };
}

export function jobPostingSchema(input: {
  title: string;
  description: string;
  slug: string;
  department: string;
  location: string;
  workMode: string;
  employmentType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  showSalary: boolean;
  publishedAt?: Date | string | null;
  closesAt?: Date | string | null;
  companyName: string;
  addressLocality?: string | null;
  addressCountry?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: input.title,
    description: input.description,
    url: absoluteUrl(`/careers/${input.slug}`),
    datePosted: toIso(input.publishedAt),
    validThrough: toIso(input.closesAt),
    employmentType: input.employmentType,
    industry: input.department,
    hiringOrganization: {
      "@type": "Organization",
      name: input.companyName,
      sameAs: absoluteUrl("/"),
    },
    jobLocationType: input.workMode === "REMOTE" ? "TELECOMMUTE" : undefined,
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: input.addressLocality || input.location,
        addressCountry: input.addressCountry || "IN",
      },
    },
    ...(input.showSalary && input.salaryMin
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: input.salaryCurrency || "INR",
            value: {
              "@type": "QuantitativeValue",
              minValue: input.salaryMin,
              maxValue: input.salaryMax ?? input.salaryMin,
              unitText: "YEAR",
            },
          },
        }
      : {}),
  };
}

export function faqSchema(items: { question: string; answer: string }[]): JsonLd | null {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
