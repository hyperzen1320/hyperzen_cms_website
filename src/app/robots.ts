import type { MetadataRoute } from "next";
import { getSeoSettings } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings();

  // A single switch in the CMS (SEO → Robots) can take the whole site out of
  // search indexes, which is what staging environments need.
  if (!seo.robotsIndex) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: absoluteUrl("/sitemap.xml"),
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/search"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
