import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { ProductCard } from "@/components/site/cards";
import { JsonLdScript } from "@/components/site/json-ld";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { getProducts, getSiteSettings } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Products",
    description: "Products designed and built in-house by Hyperzen Innovation.",
    path: "/products",
  });
}

export default async function ProductsPage() {
  const [products, settings] = await Promise.all([getProducts(), getSiteSettings()]);

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
        ])}
      />

      <PageHero
        eyebrow="Products"
        title="Products built"
        highlight="in-house."
        description="Where we found a problem worth solving more than once, we built the product ourselves. Everything here is designed, engineered and operated by our own team."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
        ]}
      />

      <SectionShell>
        {products.length ? (
          <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
            {products.map((product) => (
              <RevealItem as="li" key={product.id}>
                <ProductCard product={product} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/12 p-12 text-center">
            <p className="text-[16px] font-medium text-ink-100">Products are being prepared.</p>
            <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-300">
              Publish products from the CMS under Content → Products, and they will appear here with
              their own detail pages automatically.
            </p>
          </div>
        )}
      </SectionShell>

      <CtaBlock
        content={{
          title: "Want something like this for your business?",
          description:
            "We build products for clients with the same standards we apply to our own.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
