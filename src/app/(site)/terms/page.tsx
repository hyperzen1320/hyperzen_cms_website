import type { Metadata } from "next";
import { CmsPage, cmsPageMetadata } from "@/components/sections/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata("terms", {
    title: "Terms of Service",
    description: "The terms that apply to the use of this website and our services.",
  });
}

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  return (
    <CmsPage
      slug="terms"
      previewFlag={preview}
      fallbackTitle="Terms of Service"
      fallbackDescription="Create the Terms page in the CMS under Content → Pages."
    />
  );
}
