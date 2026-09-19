"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SESSION_KEY = "hz_sid";

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function device(): string {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1200) return "tablet";
  return "desktop";
}

export function track(type: string, payload: Record<string, string | undefined> = {}) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    type,
    path: window.location.pathname,
    sessionId: sessionId(),
    device: device(),
    referrer: document.referrer || undefined,
    ...payload,
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * First-party page-view tracking. No cookies, no third-party scripts — events
 * are stored in the project's own database and surfaced in /admin/analytics.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const key = `${pathname}?${searchParams.toString()}`;
    if (lastPath.current === key) return;
    lastPath.current = key;

    track("pageview", {
      utmSource: searchParams.get("utm_source") ?? undefined,
      utmMedium: searchParams.get("utm_medium") ?? undefined,
      utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    });
  }, [pathname, searchParams]);

  return null;
}

/** Records outbound CTA interest without blocking navigation. */
export function trackCta(label: string, value?: string) {
  track("cta_click", { label, value });
}
