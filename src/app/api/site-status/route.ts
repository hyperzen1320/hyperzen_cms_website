import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Edge-readable snapshot of the few settings the middleware needs.
 *
 * Middleware cannot reach the database, so it reads this instead. The payload
 * is deliberately tiny and cached for a few seconds, which keeps the cost of
 * the maintenance gate to roughly one query per 15 seconds site-wide.
 */
export async function GET() {
  const settings = await getSiteSettings();

  return NextResponse.json(
    {
      maintenance: settings.maintenanceMode,
      companyName: settings.companyName,
      email: settings.email,
      accent: settings.accentColor,
      accent2: settings.accentColor2,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
      },
    },
  );
}
