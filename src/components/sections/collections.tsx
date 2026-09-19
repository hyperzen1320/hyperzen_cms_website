import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading, SectionShell } from "@/components/sections/section-shell";
import {
  IndustryCard,
  PostCard,
  ProductCard,
  ProjectCard,
  ServiceCard,
  SolutionCard,
  TestimonialCard,
} from "@/components/site/cards";
import {
  getFeaturedProjects,
  getIndustries,
  getPosts,
  getProducts,
  getProjects,
  getServices,
  getSolutions,
  getTestimonials,
} from "@/lib/queries";
import type { BlockSettings } from "@/types";

type CollectionContent = {
  eyebrow?: string;
  title?: string;
  description?: string;
  limit?: number;
  ids?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
};

type Props = { content: CollectionContent; settings?: BlockSettings };

/** Keep the CMS-selected order when specific records were picked. */
function orderBySelection<T extends { id: string }>(items: T[], ids?: string[]): T[] {
  if (!ids?.length) return items;
  const selected = items.filter((item) => ids.includes(item.id));
  return selected.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export async function ServicesGridBlock({ content, settings }: Props) {
  const all = await getServices();
  const items = orderBySelection(all, content.ids).slice(0, content.limit ?? 6);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      <SectionHeading
        eyebrow={content.eyebrow ?? "Services"}
        title={content.title ?? "Engineering across the full product surface"}
        description={content.description}
        action={
          content.ctaLabel ? { label: content.ctaLabel, href: content.ctaUrl ?? "/services" } : null
        }
        className="mb-12"
      />
      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
        {items.map((service) => (
          <RevealItem as="li" key={service.id}>
            <ServiceCard service={service} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

export async function SolutionsGridBlock({ content, settings }: Props) {
  const all = await getSolutions();
  const items = orderBySelection(all, content.ids).slice(0, content.limit ?? 6);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      <SectionHeading
        eyebrow={content.eyebrow ?? "Solutions"}
        title={content.title ?? "Business systems, built to fit"}
        description={content.description}
        action={
          content.ctaLabel ? { label: content.ctaLabel, href: content.ctaUrl ?? "/solutions" } : null
        }
        className="mb-12"
      />
      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
        {items.map((solution) => (
          <RevealItem as="li" key={solution.id}>
            <SolutionCard solution={solution} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

export async function IndustryGridBlock({ content, settings }: Props) {
  const all = await getIndustries();
  const items = orderBySelection(all, content.ids).slice(0, content.limit ?? 8);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      <SectionHeading
        eyebrow={content.eyebrow ?? "Industries"}
        title={content.title ?? "Context we already understand"}
        description={content.description}
        action={
          content.ctaLabel ? { label: content.ctaLabel, href: content.ctaUrl ?? "/industries" } : null
        }
        className="mb-12"
      />
      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" as="ul">
        {items.map((industry) => (
          <RevealItem as="li" key={industry.id}>
            <IndustryCard industry={industry} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

export async function ProjectGridBlock({ content, settings }: Props) {
  const limit = content.limit ?? 3;
  const items = content.ids?.length
    ? orderBySelection(await getProjects(), content.ids).slice(0, limit)
    : await getFeaturedProjects(limit);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      <SectionHeading
        eyebrow={content.eyebrow ?? "Selected work"}
        title={content.title ?? "Systems shipped, outcomes measured"}
        description={content.description}
        action={
          content.ctaLabel ? { label: content.ctaLabel, href: content.ctaUrl ?? "/projects" } : null
        }
        className="mb-12"
      />
      <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" as="ul">
        {items.map((project, index) => (
          <RevealItem as="li" key={project.id} className={index === 0 ? "lg:col-span-2" : ""}>
            <ProjectCard project={project} featured={index === 0} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

export async function ProductGridBlock({ content, settings }: Props) {
  const all = await getProducts();
  const items = orderBySelection(all, content.ids).slice(0, content.limit ?? 3);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      <SectionHeading
        eyebrow={content.eyebrow ?? "Products"}
        title={content.title ?? "Products built in-house"}
        description={content.description}
        action={
          content.ctaLabel ? { label: content.ctaLabel, href: content.ctaUrl ?? "/products" } : null
        }
        className="mb-12"
      />
      <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" as="ul">
        {items.map((product) => (
          <RevealItem as="li" key={product.id}>
            <ProductCard product={product} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

export async function InsightsGridBlock({ content, settings }: Props) {
  const items = await getPosts({ limit: content.limit ?? 3 });
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      <SectionHeading
        eyebrow={content.eyebrow ?? "Insights"}
        title={content.title ?? "Notes from the engineering floor"}
        description={content.description}
        action={
          content.ctaLabel ? { label: content.ctaLabel, href: content.ctaUrl ?? "/insights" } : null
        }
        className="mb-12"
      />
      <RevealGroup className="grid gap-4 md:grid-cols-3" as="ul">
        {items.map((post) => (
          <RevealItem as="li" key={post.id}>
            <PostCard post={post} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

export async function TestimonialsBlock({ content, settings }: Props) {
  const all = await getTestimonials();
  const items = orderBySelection(all, content.ids).slice(0, content.limit ?? 3);
  if (!items.length) return null;

  return (
    <SectionShell settings={settings}>
      <SectionHeading
        eyebrow={content.eyebrow ?? "Client voices"}
        title={content.title ?? "What partners say"}
        description={content.description}
        className="mb-12"
      />
      <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" as="ul">
        {items.map((testimonial) => (
          <RevealItem as="li" key={testimonial.id}>
            <TestimonialCard testimonial={testimonial} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}
