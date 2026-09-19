import type { Metadata } from "next";

/**
 * The authentication portal. Kept outside the marketing site's layout so the
 * sign-in screen carries no header, footer or navigation — nothing to wander
 * off into while signing in.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ink-950">{children}</div>;
}
