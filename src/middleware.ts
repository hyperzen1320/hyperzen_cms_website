import { NextResponse, type NextRequest } from "next/server";
import { maintenanceHtml } from "@/lib/maintenance-page";

const ADMIN_COOKIE = "hz_session";
const PORTAL_COOKIE = "hz_portal";

type SiteStatus = {
  maintenance: boolean;
  companyName: string;
  email?: string;
  accent?: string;
  accent2?: string;
};

/**
 * Edge gate for the signed-in areas and for maintenance mode.
 *
 * Session cookies are only checked for presence here — the real verification
 * (database lookup, expiry, active account, role) happens in the layouts and in
 * every server action, which run on Node.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdmin = pathname.startsWith("/admin");
  const isErp = pathname.startsWith("/erp");

  // There is one sign-in screen now. Forward the old admin path to it here so
  // bookmarks get a clean server redirect rather than a rendered page.
  if (pathname === "/admin/login") {
    const legacy = new URL("/login", request.url);
    const next = request.nextUrl.searchParams.get("next");
    legacy.searchParams.set("next", next?.startsWith("/") ? next : "/admin");
    return NextResponse.redirect(legacy);
  }

  if (isAdmin || isErp) {
    const cookie = isAdmin ? ADMIN_COOKIE : PORTAL_COOKIE;
    if (request.cookies.has(cookie)) return NextResponse.next();

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Anyone holding a session keeps working through maintenance, so staff can
  // check the site before it goes back up.
  if (request.cookies.has(ADMIN_COOKIE) || request.cookies.has(PORTAL_COOKIE)) {
    return NextResponse.next();
  }

  const status = await siteStatus(request);
  if (!status?.maintenance) return NextResponse.next();

  return new NextResponse(maintenanceHtml(status), {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // 503 + Retry-After is what search engines expect during planned
      // downtime; it keeps existing rankings instead of de-indexing pages.
      "Retry-After": "3600",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/**
 * Middleware cannot reach the database, so the flag comes from a tiny cached
 * endpoint. A failure here deliberately fails open — a status lookup problem
 * must never take the site down.
 */
async function siteStatus(request: NextRequest): Promise<SiteStatus | null> {
  try {
    const response = await fetch(new URL("/api/site-status", request.nextUrl.origin), {
      next: { revalidate: 15 },
    });
    if (!response.ok) return null;
    return (await response.json()) as SiteStatus;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    /**
     * Everything except Next internals, the status endpoint itself, the sign-in
     * screen and static files — those must stay reachable while the site is off.
     */
    "/((?!_next/static|_next/image|api/site-status|login|favicon.ico|icon.svg|uploads/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|woff|woff2)$).*)",
  ],
};
