import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSiteSettings } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { saveSiteSettingsAction } from "@/app/admin/settings/actions";
import type { Field } from "@/lib/admin/fields";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Footer & CTA" };

const FIELDS: Field[] = [
  { name: "footerCtaTitle", label: "Closing CTA heading", type: "text", group: "Closing CTA" },
  {
    name: "footerCtaText",
    label: "Closing CTA text",
    type: "textarea",
    rows: 3,
    group: "Closing CTA",
  },
  { name: "footerCtaLabel", label: "Button label", type: "text", group: "Closing CTA", width: "half" },
  { name: "footerCtaUrl", label: "Button link", type: "text", group: "Closing CTA", width: "half" },

  { name: "footerDescription", label: "Footer description", type: "textarea", rows: 3, group: "Footer" },
  { name: "newsletterTitle", label: "Newsletter heading", type: "text", group: "Footer", width: "half" },
  { name: "newsletterText", label: "Newsletter text", type: "textarea", rows: 2, group: "Footer" },
  { name: "copyright", label: "Copyright line", type: "text", group: "Footer" },
];

export default async function FooterSettingsPage() {
  const user = await requireUser();
  if (!can(user.role, "website.write")) notFound();

  const settings = await getSiteSettings();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Footer & closing CTA"
        description="The conversion band and footer copy shown on every page. Footer link columns live under Navigation."
      />
      <SettingsForm
        fields={FIELDS}
        action={saveSiteSettingsAction}
        values={{
          footerCtaTitle: settings.footerCtaTitle ?? "",
          footerCtaText: settings.footerCtaText ?? "",
          footerCtaLabel: settings.footerCtaLabel ?? "",
          footerCtaUrl: settings.footerCtaUrl ?? "",
          footerDescription: settings.footerDescription ?? "",
          newsletterTitle: settings.newsletterTitle ?? "",
          newsletterText: settings.newsletterText ?? "",
          copyright: settings.copyright,
        }}
      />
    </div>
  );
}
