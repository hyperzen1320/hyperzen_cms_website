import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { portalSignOutAction } from "@/app/(portal)/login/actions";
import { Logo } from "@/components/site/logo";
import { requirePortalUser } from "@/lib/portal-auth";
import { getSiteSettings } from "@/lib/queries";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s — Hyperzen Workspace" },
  robots: { index: false, follow: false },
};

/**
 * Shell for the customer-facing ERP. Everything inside requires an active ERP
 * session; CMS staff sessions do not grant access here.
 */
export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([requirePortalUser(), getSiteSettings()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-ink-950/80 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/erp" className="flex items-center gap-2.5">
            <Logo url={settings.logoUrl} companyName={settings.companyName} />
            <span className="hidden rounded-full border border-white/12 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-300 sm:inline">
              Workspace
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-[13px] font-medium text-ink-50">{user.name}</span>
              <span className="block text-[11.5px] text-ink-400">
                {user.company || user.email}
              </span>
            </span>

            <span
              className="grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {initials(user.name)}
            </span>

            <form action={portalSignOutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/12 px-3.5 text-[13px] text-ink-200 transition-colors hover:border-white/30 hover:text-ink-50"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/8 py-5">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-ink-500">
          <span>{settings.copyright || `© ${new Date().getFullYear()} ${settings.legalName}`}</span>
          <Link href="/" className="transition-colors hover:text-ink-200">
            Back to website
          </Link>
        </div>
      </footer>
    </div>
  );
}
