/* eslint-disable @next/next/no-img-element */

/**
 * Brand mark — the Hyperzen "HZ" ring monogram.
 *
 * Drawn as inline SVG so it stays crisp at any size, inherits the CMS accent
 * gradient, and needs no network request. Uploading a logo in the CMS
 * (Settings → Branding) replaces it everywhere; the optional alternate logo is
 * swapped in wherever the interface is on a light background, which is why the
 * CMS in light mode shows it.
 */
export function Logo({
  url,
  altUrl,
  companyName,
  className = "",
  showWordmark = true,
}: {
  url?: string | null;
  altUrl?: string | null;
  companyName: string;
  className?: string;
  showWordmark?: boolean;
}) {
  if (url) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <img
          src={url}
          alt={companyName}
          className={`h-9 w-auto max-w-[200px] object-contain ${altUrl ? "light:hidden" : ""}`}
          width={200}
          height={36}
        />
        {altUrl ? (
          <img
            src={altUrl}
            alt={companyName}
            className="hidden h-9 w-auto max-w-[200px] object-contain light:block"
            width={200}
            height={36}
          />
        ) : null}
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <HyperzenMark className="size-9 shrink-0" />
      {showWordmark ? (
        <span className="text-[17px] font-semibold uppercase tracking-[0.14em] text-ink-50 light:text-ink-900">
          {companyName}
        </span>
      ) : null}
    </span>
  );
}

export function HyperzenMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" className={className} role="img" aria-label="Hyperzen">
      <defs>
        <linearGradient id="hz-gradient" x1="0.15" y1="0.05" x2="0.85" y2="0.95">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>

      {/* Ring */}
      <circle
        cx="64"
        cy="64"
        r="55"
        fill="none"
        stroke="url(#hz-gradient)"
        strokeWidth="7"
      />

      {/* H — left stem with its curved foot, plus the crossbar */}
      <path
        d="M40 34h12v40c0 6.5-3.4 10.8-9.8 12.6 3.9-3.4 5.6-7.1 5.6-11.4V34z"
        fill="url(#hz-gradient)"
      />
      <path d="M40 34h12v54h-12z" fill="url(#hz-gradient)" />
      <path d="M40 56h26v12H40z" fill="url(#hz-gradient)" />

      {/* Z — shares the H's right stem, then the diagonal and base */}
      <path d="M58 34h12v34H58z" fill="url(#hz-gradient)" />
      <path
        d="M58 34h34.5c4.6 0 6.9 3.6 4.2 6.9L56.5 90.2c-2.3 2.8-6.5 1.1-6.5-2.6V80l33-40H58V34z"
        fill="url(#hz-gradient)"
      />
      <path d="M50 82h44l-6.5 12H50z" fill="url(#hz-gradient)" />
    </svg>
  );
}
