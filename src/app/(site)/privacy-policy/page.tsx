import type { Metadata } from "next";
import { CmsPage, cmsPageMetadata } from "@/components/sections/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsPageMetadata("privacy-policy", {
    title: "Privacy Policy",
    description: "How we collect, use and protect personal information.",
  });
}

export default async function PrivacyPolicyPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  return (
    <CmsPage
      slug="privacy-policy"
      previewFlag={preview}
      fallbackTitle="Privacy Policy"
      fallbackDescription="Create the Privacy Policy page in the CMS under Content → Pages."
    />
  );
}
