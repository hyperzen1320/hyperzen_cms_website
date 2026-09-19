import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { requirePortalUser } from "@/lib/portal-auth";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Workspace" };

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Account owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

/**
 * ERP landing screen.
 *
 * Intentionally a shell: the account, session and layout are real and working,
 * ready for the ERP modules to be dropped in.
 */
export default async function ErpHomePage() {
  const [user, settings] = await Promise.all([requirePortalUser(), getSiteSettings()]);

  return (
    <div className="container-page py-14">
      <div className="max-w-2xl">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-4 text-[12.5px] text-ink-100">
          <span className="relative flex size-5 items-center justify-center">
            <span className="absolute inline-flex size-2 animate-[pulse-ring_3.2s_ease-out_infinite] rounded-full bg-[var(--accent)]" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          {ROLE_LABEL[user.role] ?? user.role}
        </p>

        <h1 className="text-[clamp(1.9rem,4vw,2.8rem)] font-semibold leading-tight tracking-tight text-ink-50">
          Welcome, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-200">
          Your workspace is set up and your account is active. The ERP modules are being prepared
          and will appear here as they are released.
        </p>
      </div>

      <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Account", value: user.name },
          { label: "Email", value: user.email },
          { label: "Company", value: user.company || "—" },
          { label: "Access", value: ROLE_LABEL[user.role] ?? user.role },
        ].map((item) => (
          <div key={item.label} className="bg-ink-950 px-6 py-5">
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              {item.label}
            </dt>
            <dd className="mt-2 truncate text-[14.5px] text-ink-100">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-7">
        <Sparkles className="size-5 text-[var(--accent)]" />
        <h2 className="mt-4 text-[18px] font-medium tracking-tight text-ink-50">
          Modules on the way
        </h2>
        <p className="mt-2.5 max-w-xl text-[14.5px] leading-relaxed text-ink-300">
          Nothing here is a placeholder you need to work around — sign-in, sessions and access
          control are live. As each module ships it will slot straight into this workspace.
        </p>

        {settings.email ? (
          <a
            href={`mailto:${settings.email}?subject=${encodeURIComponent("ERP workspace")}`}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/14 px-5 text-[14px] font-medium text-ink-50 transition-colors hover:border-white/32 hover:bg-white/[0.05]"
          >
            <Mail className="size-4" />
            Talk to your account manager
          </a>
        ) : (
          <Link
            href="/contact"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/14 px-5 text-[14px] font-medium text-ink-50 transition-colors hover:border-white/32 hover:bg-white/[0.05]"
          >
            Contact us
          </Link>
        )}
      </div>
    </div>
  );
}
