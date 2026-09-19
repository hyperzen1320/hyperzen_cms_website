"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-danger">
        Something went wrong
      </p>
      <h1 className="mt-6 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-ink-50">
        This page could not be loaded.
      </h1>
      <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-300">
        The problem has been logged. Try again, or head back to the homepage.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[12px] text-ink-500">Reference: {error.digest}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-50 px-6 text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-[14.5px] font-medium text-ink-50 transition-colors hover:border-white/35"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
