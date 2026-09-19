import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-lines opacity-40 mask-fade-b" />
        <div
          className="absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.14] blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
        />
      </div>

      <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-[var(--accent)]">
        Error 404
      </p>
      <h1 className="mt-6 text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-[1.05] tracking-tight text-ink-50">
        This page does not exist.
      </h1>
      <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-300">
        The link may be out of date, or the content may have been moved. Head back to the homepage,
        or take a look at what we do.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink-50 px-6 text-[14.5px] font-semibold text-ink-950 transition-colors hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <Link
          href="/services"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-[14.5px] font-medium text-ink-50 transition-colors hover:border-white/35 hover:bg-white/[0.05]"
        >
          <Compass className="size-4" />
          Browse services
        </Link>
      </div>
    </div>
  );
}
