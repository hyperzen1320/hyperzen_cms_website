"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-danger">
        Something went wrong
      </p>
      <h1 className="mt-6 text-[clamp(1.9rem,4vw,2.8rem)] font-semibold tracking-tight text-ink-50">
        We hit an unexpected error.
      </h1>
      <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-300">
        The issue has been logged. Try again — if it keeps happening, let us know and we will look
        into it.
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
