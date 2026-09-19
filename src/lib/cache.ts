import { revalidatePath } from "next/cache";

/**
 * Public routes are rendered dynamically (see the route-segment config in the
 * site layout), so CMS changes are visible on the very next request. These
 * helpers additionally drop any Next.js full-route cache entries that a
 * deployment target may have created for static assets of a route.
 */
export const CONTENT_PATHS: Record<string, string[]> = {
  page: ["/"],
  service: ["/", "/services"],
  solution: ["/", "/solutions"],
  industry: ["/", "/industries"],
  product: ["/", "/products"],
  project: ["/", "/projects"],
  testimonial: ["/"],
  post: ["/", "/insights"],
  job: ["/careers"],
  faq: ["/", "/contact"],
  navigation: ["/"],
  settings: ["/"],
  seo: ["/"],
};

export function revalidateContent(entity: keyof typeof CONTENT_PATHS, slug?: string | null) {
  const paths = CONTENT_PATHS[entity] ?? ["/"];
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // revalidatePath throws outside of a request scope — safe to ignore.
    }
  }
  if (slug) {
    const base = paths[paths.length - 1];
    if (base && base !== "/") {
      try {
        revalidatePath(`${base}/${slug}`);
      } catch {
        /* noop */
      }
    }
  }
  try {
    revalidatePath("/sitemap.xml");
  } catch {
    /* noop */
  }
}
