import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSiteSettings } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { saveSiteSettingsAction } from "@/app/admin/settings/actions";
import { asObject } from "@/lib/utils";
import type { Field } from "@/lib/admin/fields";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Branding" };

const FIELDS: Field[] = [
  {
    name: "logoUrl",
    label: "Logo",
    type: "image",
    group: "Identity",
    help: "Shown in the header and footer. Leave empty to use the built-in HZ monogram.",
  },
  {
    name: "logoDarkUrl",
    label: "Alternate logo",
    type: "image",
    group: "Identity",
    help: "Optional variant for light backgrounds.",
  },
  {
    name: "faviconUrl",
    label: "Favicon",
    type: "image",
    group: "Identity",
    help: "A square PNG or SVG, at least 64×64.",
  },

  {
    name: "accentColor",
    label: "Primary accent",
    type: "color",
    group: "Colours",
    width: "half",
    help: "Drives buttons, highlights and the hero visual.",
  },
  {
    name: "accentColor2",
    label: "Secondary accent",
    type: "color",
    group: "Colours",
    width: "half",
    help: "The far end of every brand gradient.",
  },

  {
    name: "announcementEnabled",
    label: "Show announcement bar",
    type: "switch",
    group: "Announcement",
    width: "half",
  },
  { name: "announcementText", label: "Announcement text", type: "text", group: "Announcement" },
  {
    name: "announcementUrl",
    label: "Announcement link",
    type: "text",
    group: "Announcement",
    width: "half",
  },
];

export default async function BrandingPage() {
  const user = await requireUser();
  if (!can(user.role, "settings.write")) notFound();

  const settings = await getSiteSettings();
  const announcement = asObject<{ enabled?: boolean; text?: string; url?: string }>(
    settings.announcement,
    {},
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Branding"
        description="Logo, favicon and the accent colours used across the entire website."
      />
      <SettingsForm
        fields={FIELDS}
        action={saveSiteSettingsAction}
        values={{
          logoUrl: settings.logoUrl ?? "",
          logoDarkUrl: settings.logoDarkUrl ?? "",
          faviconUrl: settings.faviconUrl ?? "",
          accentColor: settings.accentColor,
          accentColor2: settings.accentColor2,
          announcementEnabled: announcement.enabled ?? false,
          announcementText: announcement.text ?? "",
          announcementUrl: announcement.url ?? "",
        }}
      />
    </div>
  );
}
