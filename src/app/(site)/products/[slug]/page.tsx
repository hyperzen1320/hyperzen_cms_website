/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SpotlightCard } from "@/components/ui/spotlight";
import { JsonLdScript } from "@/components/site/json-ld";
import { ProductCard } from "@/components/site/cards";
import { getProductBySlug, getProducts, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { asArray } from "@/lib/utils";
import type { FeatureItem, PricingTier } from "@/types";
import { isPreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

const STATUS_LABEL: Record<string, string> = {
  CONCEPT: "Concept",
  IN_DEVELOPMENT: "In development",
  BETA: "Beta",
  LIVE: "Live",
  SUNSET: "Sunset",
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return buildMetadata({ title: "Product not found", noIndex: true });

  return buildMetadata({
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description,
    path: `/products/${product.slug}`,
    image: product.ogImage || product.coverUrl,
    noIndex: product.noIndex,
  });
}

export default async function ProductDetailPage({ params, searchParams }: Props) {
  const [{ slug }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const preview = await isPreview(previewParam);
  const [product, settings] = await Promise.all([getProductBySlug(slug, preview), getSiteSettings()]);
  if (!product) notFound();

  const features = asArray<FeatureItem>(product.features);
  const technologies = asArray<string>(product.technologies);
  const screenshots = asArray<string | { url: string; alt?: string }>(product.screenshots);
  const pricing = asArray<PricingTier>(product.pricing);
  const related = (await getProducts()).filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <>
      {preview ? (
        <PreviewBanner
          status={product.status}
          editHref={`/admin/products/${product.id}`}
        />
      ) : null}

      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: product.name, href: `/products/${product.slug}` },
        ])}
      />

      <PageHero
        eyebrow={product.category || "Product"}
        title={product.name}
        description={product.tagline || product.description}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: product.name, href: `/products/${product.slug}` },
        ]}
      >
        {product.websiteUrl || product.ctaUrl ? (
          <ButtonLink href={product.ctaUrl || product.websiteUrl!} size="lg">
            {product.ctaLabel || "Visit product"}
            <ArrowUpRight className="size-4" />
          </ButtonLink>
        ) : null}
        <ButtonLink href={settings.primaryCtaUrl} variant="outline" size="lg">
          Talk to us about it
        </ButtonLink>
      </PageHero>

      <SectionShell settings={{ spacing: "compact" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/12 px-3.5 py-1.5 text-[12.5px] text-ink-100">
            {STATUS_LABEL[product.productStatus] ?? product.productStatus}
          </span>
          {product.category ? (
            <span className="rounded-full border border-white/12 px-3.5 py-1.5 text-[12.5px] text-ink-300">
              {product.category}
            </span>
          ) : null}
        </div>

        {product.coverUrl ? (
          <Reveal>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/8">
              <img src={product.coverUrl} alt={product.name} className="w-full object-cover" />
            </div>
          </Reveal>
        ) : null}

        {product.longDescription ? (
          <div className="mt-10 max-w-3xl space-y-4 text-[16.5px] leading-relaxed text-ink-200">
            {product.longDescription.split("\n\n").map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </SectionShell>

      {features.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading eyebrow="Features" title="What it does" className="mb-12" />
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {features.map((feature) => (
              <RevealItem as="li" key={feature.title}>
                <SpotlightCard className="h-full p-7">
                  <Icon name={feature.icon} className="size-5 text-[var(--accent)]" />
                  <h3 className="mt-5 text-[16.5px] font-medium text-ink-50">{feature.title}</h3>
                  {feature.description ? (
                    <p className="mt-2.5 text-[14px] leading-relaxed text-ink-300">
                      {feature.description}
                    </p>
                  ) : null}
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </SectionShell>
      ) : null}

      {screenshots.length ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <SectionHeading eyebrow="Screens" title="Inside the product" className="mb-10" />
          <ul className="grid gap-4 md:grid-cols-2">
            {screenshots.map((shot, index) => {
              const url = typeof shot === "string" ? shot : shot.url;
              const alt = typeof shot === "string" ? `${product.name} screenshot` : (shot.alt ?? "");
              if (!url) return null;
              return (
                <li key={`${url}-${index}`} className="overflow-hidden rounded-2xl border border-white/8">
                  <img src={url} alt={alt} className="w-full object-cover" loading="lazy" />
                </li>
              );
            })}
          </ul>
        </SectionShell>
      ) : null}

      {pricing.length ? (
        <SectionShell>
          <SectionHeading eyebrow="Pricing" title="Plans" className="mb-12" />
          <ul className="grid gap-4 md:grid-cols-3">
            {pricing.map((tier) => (
              <li
                key={tier.name}
                className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-7"
              >
                <p className="text-[15px] font-medium text-ink-50">{tier.name}</p>
                <p className="mt-3 text-[28px] font-semibold tracking-tight text-ink-50">
                  {tier.price}
                </p>
                {tier.description ? (
                  <p className="mt-2 text-[13.5px] text-ink-300">{tier.description}</p>
                ) : null}
                {tier.features?.length ? (
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                        <span className="text-[14px] text-ink-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {technologies.length ? (
        <SectionShell settings={{ spacing: "compact" }}>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-ink-400">
            Built with
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-white/10 px-3.5 py-1.5 font-mono text-[12.5px] text-ink-200"
              >
                {tech}
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {related.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <SectionHeading
            eyebrow="More"
            title="Other products"
            action={{ label: "All products", href: "/products" }}
            className="mb-12"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      <CtaBlock
        content={{
          title: `Interested in ${product.name}?`,
          description: "Get in touch and we will show you how it works in practice.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
