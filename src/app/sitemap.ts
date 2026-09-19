import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" },
  { path: "/solutions", priority: 0.8, changeFrequency: "weekly" },
  { path: "/industries", priority: 0.8, changeFrequency: "weekly" },
  { path: "/products", priority: 0.7, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.8, changeFrequency: "weekly" },
  { path: "/insights", priority: 0.8, changeFrequency: "daily" },
  { path: "/careers", priority: 0.6, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/book-consultation", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = { status: "PUBLISHED" as const, noIndex: false };

  const [services, solutions, industries, products, projects, posts, jobs, pages] =
    await Promise.all([
      prisma.service.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.solution.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.industry.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.product.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.project.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.job.findMany({ where: published, select: { slug: true, updatedAt: true } }),
      prisma.page.findMany({
        where: { status: "PUBLISHED", noIndex: false, isSystem: false },
        select: { slug: true, updatedAt: true },
      }),
    ]);

  const now = new Date();

  const entry = (
    path: string,
    lastModified: Date,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  ) => ({ url: absoluteUrl(path), lastModified, changeFrequency, priority });

  return [
    ...STATIC_ROUTES.map((route) =>
      entry(route.path, now, route.priority, route.changeFrequency),
    ),
    ...services.map((item) => entry(`/services/${item.slug}`, item.updatedAt, 0.8, "monthly")),
    ...solutions.map((item) => entry(`/solutions/${item.slug}`, item.updatedAt, 0.7, "monthly")),
    ...industries.map((item) => entry(`/industries/${item.slug}`, item.updatedAt, 0.7, "monthly")),
    ...products.map((item) => entry(`/products/${item.slug}`, item.updatedAt, 0.7, "monthly")),
    ...projects.map((item) => entry(`/projects/${item.slug}`, item.updatedAt, 0.7, "monthly")),
    ...posts.map((item) => entry(`/insights/${item.slug}`, item.updatedAt, 0.6, "weekly")),
    ...jobs.map((item) => entry(`/careers/${item.slug}`, item.updatedAt, 0.5, "weekly")),
    ...pages.map((item) => entry(`/${item.slug}`, item.updatedAt, 0.5, "monthly")),
  ];
}
