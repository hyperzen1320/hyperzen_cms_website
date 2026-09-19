/**
 * The maintenance response body.
 *
 * Served from middleware so visitors get a real `503 Service Unavailable`
 * rather than a 200 that search engines would treat as the site's new content.
 * It is a self-contained document — no CSS or JS to fetch, which matters when
 * the site is deliberately offline.
 */
export function maintenanceHtml(options: {
  companyName: string;
  email?: string;
  accent?: string;
  accent2?: string;
}): string {
  const company = escapeHtml(options.companyName || "This site");
  const email = options.email ? escapeHtml(options.email) : "";
  const accent = safeColor(options.accent, "#3FC8E4");
  const accent2 = safeColor(options.accent2, "#1F7ACD");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Temporarily offline — ${company}</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    padding: 2rem 1.25rem; background: #050507; color: #e9e9ef; text-align: center;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .glow {
    position: fixed; inset: 0; pointer-events: none; z-index: -1;
    background: radial-gradient(36rem 36rem at 50% 30%, ${accent}22, transparent 70%);
  }
  .mark { width: 56px; height: 56px; margin: 0 auto 2rem; display: block; }
  h1 { margin: 0; font-size: clamp(1.75rem, 5vw, 2.75rem); line-height: 1.1; letter-spacing: -0.02em; font-weight: 600; }
  p { margin: 1.25rem auto 0; max-width: 30rem; font-size: 1rem; line-height: 1.65; color: #8b8b98; }
  a {
    display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.15); color: #e9e9ef; text-decoration: none;
    font-size: 0.9rem; font-weight: 500; transition: border-color .2s;
  }
  a:hover { border-color: rgba(255,255,255,0.35); }
  .foot { margin-top: 2.5rem; font-size: 0.75rem; color: #5a5a68; }
</style>
</head>
<body>
  <div class="glow"></div>
  <main>
    <svg class="mark" viewBox="0 0 128 128" role="img" aria-label="${company}">
      <defs>
        <linearGradient id="g" x1="0.15" y1="0.05" x2="0.85" y2="0.95">
          <stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${accent2}"/>
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="55" fill="none" stroke="url(#g)" stroke-width="7"/>
      <path d="M40 34h12v54h-12z" fill="url(#g)"/>
      <path d="M40 56h26v12H40z" fill="url(#g)"/>
      <path d="M58 34h12v34H58z" fill="url(#g)"/>
      <path d="M58 34h34.5c4.6 0 6.9 3.6 4.2 6.9L56.5 90.2c-2.3 2.8-6.5 1.1-6.5-2.6V80l33-40H58V34z" fill="url(#g)"/>
      <path d="M50 82h44l-6.5 12H50z" fill="url(#g)"/>
    </svg>
    <h1>We are making some improvements.</h1>
    <p>The site is briefly offline while we ship an update. It will be back shortly.</p>
    ${email ? `<a href="mailto:${email}">${email}</a>` : ""}
    <p class="foot">${company}</p>
  </main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only hex colours from the CMS reach the inline stylesheet. */
function safeColor(value: string | undefined, fallback: string): string {
  return value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
}
