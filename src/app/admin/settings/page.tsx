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

export const metadata: Metadata = { title: "General settings" };

const FIELDS: Field[] = [
  { name: "companyName", label: "Company name", type: "text", group: "Company", width: "half", required: true },
  { name: "legalName", label: "Legal entity name", type: "text", group: "Company", width: "half" },
  { name: "tagline", label: "Tagline", type: "text", group: "Company" },
  {
    name: "description",
    label: "Company description",
    type: "textarea",
    rows: 3,
    group: "Company",
    help: "Used as the default meta description and in the footer.",
  },
  { name: "copyright", label: "Copyright line", type: "text", group: "Company" },

  { name: "email", label: "Contact email", type: "text", group: "Contact", width: "half" },
  { name: "phone", label: "Phone", type: "text", group: "Contact", width: "half" },
  { name: "address", label: "Address", type: "textarea", rows: 2, group: "Contact" },
  { name: "addressLocality", label: "City", type: "text", group: "Contact", width: "half" },
  { name: "addressRegion", label: "State / region", type: "text", group: "Contact", width: "half" },
  { name: "postalCode", label: "Postal code", type: "text", group: "Contact", width: "half" },
  { name: "addressCountry", label: "Country code", type: "text", group: "Contact", width: "half", placeholder: "IN" },
  { name: "mapUrl", label: "Map link", type: "text", group: "Contact" },

  { name: "primaryCtaLabel", label: "Primary CTA label", type: "text", group: "Call to action", width: "half" },
  { name: "primaryCtaUrl", label: "Primary CTA link", type: "text", group: "Call to action", width: "half" },

  {
    name: "maintenanceMode",
    label: "Maintenance mode",
    type: "switch",
    group: "Advanced",
    help: "Reserved for taking the public site offline during a migration.",
  },
];

export default async function GeneralSettingsPage() {
  const user = await requireUser();
  if (!can(user.role, "settings.write")) notFound();

  const settings = await getSiteSettings();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="General settings"
        description="Company details used across the website, structured data and email templates."
      />
      <SettingsForm
        fields={FIELDS}
        action={saveSiteSettingsAction}
        values={{
          companyName: settings.companyName,
          legalName: settings.legalName,
          tagline: settings.tagline,
          description: settings.description,
          copyright: settings.copyright,
          email: settings.email,
          phone: settings.phone ?? "",
          address: settings.address ?? "",
          addressLocality: settings.addressLocality ?? "",
          addressRegion: settings.addressRegion ?? "",
          postalCode: settings.postalCode ?? "",
          addressCountry: settings.addressCountry ?? "",
          mapUrl: settings.mapUrl ?? "",
          primaryCtaLabel: settings.primaryCtaLabel,
          primaryCtaUrl: settings.primaryCtaUrl,
          maintenanceMode: settings.maintenanceMode,
        }}
      />
    </div>
  );
}
