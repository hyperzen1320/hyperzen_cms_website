import Script from "next/script";

/**
 * Optional third-party analytics, configured from the CMS (Settings → General).
 *
 * The site's own first-party tracking always runs; this simply adds a provider
 * on top when one is configured. Only known providers with a plain identifier
 * are accepted, so a CMS field can never inject arbitrary script.
 */
export function AnalyticsProvider({
  provider,
  id,
}: {
  provider?: string | null;
  id?: string | null;
}) {
  if (!provider || !id) return null;

  const identifier = id.trim();
  if (!/^[\w.@:/-]{2,120}$/.test(identifier)) return null;

  switch (provider.toLowerCase()) {
    case "plausible":
      return (
        <Script
          defer
          data-domain={identifier}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      );

    case "umami":
      return (
        <Script
          defer
          data-website-id={identifier}
          src="https://cloud.umami.is/script.js"
          strategy="afterInteractive"
        />
      );

    case "fathom":
      return (
        <Script defer data-site={identifier} src="https://cdn.usefathom.com/script.js" strategy="afterInteractive" />
      );

    case "ga":
    case "google":
    case "gtag":
      return (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(identifier)}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${identifier}');`}
          </Script>
        </>
      );

    default:
      // "internal" (the default) and anything unrecognised add no third-party script.
      return null;
  }
}
