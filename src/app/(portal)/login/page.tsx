import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { PortalAuthForm } from "@/app/(portal)/login/portal-auth-form";
import { Logo } from "@/components/site/logo";
import { getCurrentUser } from "@/lib/auth";
import { getPortalUser } from "@/lib/portal-auth";
import { getSiteSettings } from "@/lib/queries";
import { safeRedirect } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; tab?: string; registered?: string }>;
}) {
  const [{ next, tab }, admin, customer, settings] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getPortalUser(),
    getSiteSettings(),
  ]);

  // Already signed in — send them where they belong rather than showing a form.
  if (admin) redirect(safeRedirect(next, "/admin"));
  if (customer) redirect(safeRedirect(next, "/erp"));

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div
          className="absolute left-1/2 top-0 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, var(--accent), color-mix(in oklab, var(--accent-2) 60%, transparent) 55%, transparent 72%)",
          }}
        />
      </div>

      <div className="w-full max-w-[27rem]">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" aria-label={`${settings.companyName} — home`}>
            <Logo url={settings.logoUrl} companyName={settings.companyName} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-400 transition-colors hover:text-ink-100"
          >
            <ArrowLeft className="size-3.5" />
            Website
          </Link>
        </div>

        <div className="rounded-2xl border border-white/8 bg-ink-900/60 p-7 backdrop-blur-xl sm:p-8">
          <PortalAuthForm
            defaultTab={tab === "signup" ? "signup" : "signin"}
            next={next ? safeRedirect(next, "") : ""}
            companyName={settings.companyName}
          />
        </div>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          <li className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-3">
            <Building2 className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
            <span className="text-[12.5px] leading-relaxed text-ink-300">
              <span className="block font-medium text-ink-100">Client portal</span>
              Your ERP workspace
            </span>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
            <span className="text-[12.5px] leading-relaxed text-ink-300">
              <span className="block font-medium text-ink-100">Team</span>
              CMS for {settings.companyName} staff
            </span>
          </li>
        </ul>

        <p className="mt-6 text-center text-[12.5px] leading-relaxed text-ink-500">
          One sign-in for both. We will take you to the right place automatically.
        </p>
      </div>
    </div>
  );
}
