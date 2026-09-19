import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSiteSettings } from "@/lib/queries";
import { Card, PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { saveSiteSettingsAction } from "@/app/admin/settings/actions";
import { SOCIAL_PLATFORMS } from "@/components/site/social-icon";
import { asArray } from "@/lib/utils";
import type { Field } from "@/lib/admin/fields";
import type { SocialLink } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Social links" };

const FIELDS: Field[] = [
  {
    name: "socialLinks",
    label: "Social profiles",
    type: "repeater",
    subfields: [
      { name: "label", label: "Label", placeholder: "LinkedIn" },
      { name: "url", label: "URL", placeholder: "https://linkedin.com/company/…" },
      { name: "icon", label: "Icon key", placeholder: "linkedin" },
    ],
    help: "Shown in the footer and included in the Organization structured data.",
  },
];

export default async function SocialLinksPage() {
  const user = await requireUser();
  if (!can(user.role, "website.write")) notFound();

  const settings = await getSiteSettings();
  const links = asArray<SocialLink>(settings.socialLinks);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Social links"
        description="Profiles linked from the footer. These also feed the sameAs field in structured data."
      />

      <SettingsForm fields={FIELDS} action={saveSiteSettingsAction} values={{ socialLinks: links }}>
        <Card className="mb-4">
          <p className="text-[13px] text-[var(--a-muted)]">
            Recognised icon keys:{" "}
            <span className="font-mono text-[12.5px] text-[var(--a-fg)]">
              {SOCIAL_PLATFORMS.join(", ")}
            </span>
            . Anything else falls back to a globe icon.
          </p>
        </Card>
      </SettingsForm>
    </div>
  );
}
