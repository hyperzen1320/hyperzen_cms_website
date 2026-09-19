import type { Metadata } from "next";
import { CmsPage, cmsPageMetadata } from "@/components/sections/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata("about", {
    title: "About",
    description:
      "Hyperzen Innovation combines software engineering, AI, automation, cloud, data and product design to build scalable digital products.",
  });
}

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  return (
    <CmsPage
      slug="about"
      previewFlag={preview}
      fallbackTitle="About Hyperzen"
      fallbackDescription="Create the About page in the CMS under Content → Pages to publish this content."
    />
  );
}
