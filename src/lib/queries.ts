import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";
import type {
  BlogPost,
  Category,
  FAQ,
  Industry,
  Job,
  NavigationItem,
  Page,
  PageSection,
  Product,
  Project,
  SEOSettings,
  Service,
  SiteSettings,
  Solution,
  Testimonial,
} from "@prisma/client";

const PUBLISHED = { status: "PUBLISHED" as const };

// ---------------------------------------------------------------------------
// Singletons — site settings / SEO
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  id: "singleton",
  companyName: "Hyperzen Innovation",
  legalName: "Hyperzen Innovation Pvt Ltd",
  tagline: "Where ideas meet innovation.",
  description:
    "Hyperzen builds intelligent digital systems, software products and automation solutions for ambitious businesses.",
  email: "hello@hyperzen.in",
  copyright: `© ${new Date().getFullYear()} Hyperzen Innovation Pvt Ltd. All rights reserved.`,
  primaryCtaLabel: "Start a Project",
  primaryCtaUrl: "/contact",
  accentColor: "#5B8CFF",
  accentColor2: "#8B5CF6",
} as const;

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const existing = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      companyName: DEFAULT_SETTINGS.companyName,
      legalName: DEFAULT_SETTINGS.legalName,
      tagline: DEFAULT_SETTINGS.tagline,
      description: DEFAULT_SETTINGS.description,
      email: DEFAULT_SETTINGS.email,
      copyright: DEFAULT_SETTINGS.copyright,
    },
  });
});

export const getSeoSettings = cache(async (): Promise<SEOSettings> => {
  const existing = await prisma.sEOSettings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.sEOSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteTitle: "Hyperzen Innovation",
      titleTemplate: "%s — Hyperzen Innovation",
      metaDescription: DEFAULT_SETTINGS.description,
    },
  });
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export type NavItemWithChildren = NavigationItem & { children: NavigationItem[] };

export const getNavigation = cache(async (): Promise<Record<string, NavItemWithChildren[]>> => {
  const items = await prisma.navigationItem.findMany({
    where: { isVisible: true, parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: { where: { isVisible: true }, orderBy: { order: "asc" } },
    },
  });

  return items.reduce<Record<string, NavItemWithChildren[]>>((acc, item) => {
    (acc[item.location] ??= []).push(item);
    return acc;
  }, {});
});

// ---------------------------------------------------------------------------
// Pages & page builder
// ---------------------------------------------------------------------------

export type PageWithSections = Page & { sections: PageSection[] };

export const getPageBySlug = cache(
  async (slug: string, allowDraft = false): Promise<PageWithSections | null> => {
    return prisma.page.findFirst({
      where: { slug, ...(allowDraft ? {} : PUBLISHED) },
      include: { sections: { where: { isVisible: true }, orderBy: { order: "asc" } } },
    });
  },
);

export const getPageForPreview = cache(async (slug: string): Promise<PageWithSections | null> => {
  return prisma.page.findFirst({
    where: { slug },
    include: { sections: { orderBy: { order: "asc" } } },
  });
});

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const getServices = cache(async (limit?: number): Promise<Service[]> => {
  return prisma.service.findMany({
    where: PUBLISHED,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
});

export const getServiceBySlug = cache(
  async (slug: string, preview = false): Promise<Service | null> => {
    return prisma.service.findFirst({ where: { slug, ...(preview ? {} : PUBLISHED) } });
  },
);

// ---------------------------------------------------------------------------
// Solutions
// ---------------------------------------------------------------------------

export const getSolutions = cache(async (limit?: number): Promise<Solution[]> => {
  return prisma.solution.findMany({
    where: PUBLISHED,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
});

export const getSolutionBySlug = cache(
  async (slug: string, preview = false): Promise<Solution | null> => {
    return prisma.solution.findFirst({ where: { slug, ...(preview ? {} : PUBLISHED) } });
  },
);

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------

export const getIndustries = cache(async (limit?: number): Promise<Industry[]> => {
  return prisma.industry.findMany({
    where: PUBLISHED,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
});

export const getIndustryBySlug = cache(async (slug: string, preview = false) => {
  return prisma.industry.findFirst({
    where: { slug, ...(preview ? {} : PUBLISHED) },
    include: {
      projects: {
        where: PUBLISHED,
        orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
        take: 3,
      },
    },
  });
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const getProducts = cache(async (limit?: number): Promise<Product[]> => {
  return prisma.product.findMany({
    where: PUBLISHED,
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "asc" }],
    take: limit,
  });
});

export const getProductBySlug = cache(
  async (slug: string, preview = false): Promise<Product | null> => {
    return prisma.product.findFirst({ where: { slug, ...(preview ? {} : PUBLISHED) } });
  },
);

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export type ProjectWithRelations = Project & {
  industry: Industry | null;
  services: Service[];
  testimonial: Testimonial | null;
};

export const getProjects = cache(
  async (options: { limit?: number; industrySlug?: string } = {}): Promise<ProjectWithRelations[]> => {
    return prisma.project.findMany({
      where: {
        ...PUBLISHED,
        ...(options.industrySlug ? { industry: { slug: options.industrySlug } } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { publishedAt: "desc" }],
      take: options.limit,
      include: { industry: true, services: true, testimonial: true },
    });
  },
);

export const getFeaturedProjects = cache(async (limit = 3): Promise<ProjectWithRelations[]> => {
  const featured = await prisma.project.findMany({
    where: { ...PUBLISHED, isFeatured: true },
    orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
    take: limit,
    include: { industry: true, services: true, testimonial: true },
  });
  if (featured.length >= limit) return featured;
  const fill = await prisma.project.findMany({
    where: { ...PUBLISHED, id: { notIn: featured.map((item) => item.id) } },
    orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
    take: limit - featured.length,
    include: { industry: true, services: true, testimonial: true },
  });
  return [...featured, ...fill];
});

export const getProjectBySlug = cache(
  async (slug: string, preview = false): Promise<ProjectWithRelations | null> => {
    return prisma.project.findFirst({
      where: { slug, ...(preview ? {} : PUBLISHED) },
      include: { industry: true, services: true, testimonial: true },
    });
  },
);

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export const getTestimonials = cache(async (limit?: number): Promise<Testimonial[]> => {
  return prisma.testimonial.findMany({
    where: PUBLISHED,
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
});

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export type PostWithRelations = BlogPost & {
  category: Category | null;
  tags: { id: string; name: string; slug: string }[];
};

export const getPosts = cache(
  async (
    options: { limit?: number; skip?: number; categorySlug?: string; query?: string } = {},
  ): Promise<PostWithRelations[]> => {
    return prisma.blogPost.findMany({
      where: {
        ...PUBLISHED,
        ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
        ...(options.query
          ? {
              OR: [
                { title: { contains: options.query, mode: "insensitive" as const } },
                { excerpt: { contains: options.query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: options.limit,
      skip: options.skip,
      include: { category: true, tags: { select: { id: true, name: true, slug: true } } },
    });
  },
);

export const countPosts = cache(
  async (options: { categorySlug?: string; query?: string } = {}): Promise<number> => {
    return prisma.blogPost.count({
      where: {
        ...PUBLISHED,
        ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
        ...(options.query
          ? {
              OR: [
                { title: { contains: options.query, mode: "insensitive" as const } },
                { excerpt: { contains: options.query, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
    });
  },
);

export const getPostBySlug = cache(
  async (slug: string, preview = false): Promise<PostWithRelations | null> => {
    return prisma.blogPost.findFirst({
      where: { slug, ...(preview ? {} : PUBLISHED) },
      include: { category: true, tags: { select: { id: true, name: true, slug: true } } },
    });
  },
);

export const getRelatedPosts = cache(
  async (postId: string, categoryId: string | null, limit = 3): Promise<PostWithRelations[]> => {
    const related = categoryId
      ? await prisma.blogPost.findMany({
          where: { ...PUBLISHED, categoryId, id: { not: postId } },
          orderBy: { publishedAt: "desc" },
          take: limit,
          include: { category: true, tags: { select: { id: true, name: true, slug: true } } },
        })
      : [];
    if (related.length >= limit) return related;
    const fill = await prisma.blogPost.findMany({
      where: { ...PUBLISHED, id: { notIn: [postId, ...related.map((p) => p.id)] } },
      orderBy: { publishedAt: "desc" },
      take: limit - related.length,
      include: { category: true, tags: { select: { id: true, name: true, slug: true } } },
    });
    return [...related, ...fill];
  },
);

export const getCategories = cache(async (): Promise<(Category & { _count: { posts: number } })[]> => {
  return prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { posts: { where: PUBLISHED } } } },
  });
});

// ---------------------------------------------------------------------------
// Careers
// ---------------------------------------------------------------------------

export const getJobs = cache(async (): Promise<Job[]> => {
  return prisma.job.findMany({
    where: PUBLISHED,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
});

export const getJobBySlug = cache(
  async (slug: string, preview = false): Promise<Job | null> => {
    return prisma.job.findFirst({ where: { slug, ...(preview ? {} : PUBLISHED) } });
  },
);

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export const getFaqs = cache(async (category?: string): Promise<FAQ[]> => {
  return prisma.fAQ.findMany({
    where: { ...PUBLISHED, ...(category ? { category } : {}) },
    orderBy: { order: "asc" },
  });
});

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------

export type SearchResult = {
  type: "Service" | "Solution" | "Industry" | "Product" | "Project" | "Insight";
  title: string;
  description: string;
  href: string;
};

export async function searchSite(query: string, limit = 8): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const contains = { contains: q, mode: "insensitive" as const };

  const [services, solutions, industries, products, projects, posts] = await Promise.all([
    prisma.service.findMany({
      where: { ...PUBLISHED, OR: [{ title: contains }, { shortDesc: contains }] },
      take: limit,
      select: { title: true, shortDesc: true, slug: true },
    }),
    prisma.solution.findMany({
      where: { ...PUBLISHED, OR: [{ title: contains }, { shortDesc: contains }] },
      take: limit,
      select: { title: true, shortDesc: true, slug: true },
    }),
    prisma.industry.findMany({
      where: { ...PUBLISHED, OR: [{ name: contains }, { shortDesc: contains }] },
      take: limit,
      select: { name: true, shortDesc: true, slug: true },
    }),
    prisma.product.findMany({
      where: { ...PUBLISHED, OR: [{ name: contains }, { description: contains }] },
      take: limit,
      select: { name: true, description: true, slug: true },
    }),
    prisma.project.findMany({
      where: { ...PUBLISHED, OR: [{ title: contains }, { summary: contains }] },
      take: limit,
      select: { title: true, summary: true, slug: true },
    }),
    prisma.blogPost.findMany({
      where: { ...PUBLISHED, OR: [{ title: contains }, { excerpt: contains }] },
      take: limit,
      select: { title: true, excerpt: true, slug: true },
    }),
  ]);

  return [
    ...services.map((s) => ({
      type: "Service" as const,
      title: s.title,
      description: s.shortDesc,
      href: `/services/${s.slug}`,
    })),
    ...solutions.map((s) => ({
      type: "Solution" as const,
      title: s.title,
      description: s.shortDesc,
      href: `/solutions/${s.slug}`,
    })),
    ...industries.map((i) => ({
      type: "Industry" as const,
      title: i.name,
      description: i.shortDesc,
      href: `/industries/${i.slug}`,
    })),
    ...products.map((p) => ({
      type: "Product" as const,
      title: p.name,
      description: p.description,
      href: `/products/${p.slug}`,
    })),
    ...projects.map((p) => ({
      type: "Project" as const,
      title: p.title,
      description: p.summary,
      href: `/projects/${p.slug}`,
    })),
    ...posts.map((p) => ({
      type: "Insight" as const,
      title: p.title,
      description: p.excerpt ?? "",
      href: `/insights/${p.slug}`,
    })),
  ].slice(0, limit * 2);
}
