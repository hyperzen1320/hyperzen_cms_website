import { Suspense } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { Header } from "@/components/site/header";
import { SiteFooter } from "@/components/site/site-footer";
import { AnalyticsTracker } from "@/components/site/analytics";
import { JsonLdScript } from "@/components/site/json-ld";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/queries";
import { organizationSchema, websiteSchema } from "@/lib/seo";

/**
 * Public pages render per request so anything published in the CMS is live
 * immediately — no rebuild, no cache flush.
 */
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  // Visitors never reach this layout while maintenance is on — middleware
  // answers them with a 503 first. Anyone who does get here is signed in, so
  // tell them plainly that the public cannot see what they are looking at.
  const staff = settings.maintenanceMode ? await getCurrentUser() : null;

  const [organization, website] = await Promise.all([organizationSchema(), websiteSchema()]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <JsonLdScript data={organization} id="organization-schema" />
      <JsonLdScript data={website} id="website-schema" />

      {settings.maintenanceMode ? <MaintenanceNotice signedIn={Boolean(staff)} /> : null}

      <Header />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter />

      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
    </div>
  );
}

/**
 * Visitors never reach this — middleware answers them with a 503 first. This is
 * the reassurance for whoever is signed in: the site they are looking at is not
 * the site the public can see.
 */
function MaintenanceNotice({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="relative z-[120] border-b border-warning/30 bg-warning/10">
      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[13px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-warning">
          <Wrench className="size-3.5" />
          Maintenance mode is on
        </span>
        <span className="text-ink-200">
          Visitors get the maintenance page and a 503 response.
          {signedIn ? " You can browse because you are signed in." : ""}
        </span>
        <Link
          href="/admin/settings"
          className="ml-auto rounded-full border border-warning/40 px-3 py-1 text-[12.5px] font-medium text-warning transition-colors hover:bg-warning/10"
        >
          Turn off
        </Link>
      </div>
    </div>
  );
}