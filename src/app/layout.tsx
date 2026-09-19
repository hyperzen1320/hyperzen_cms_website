import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AnalyticsProvider } from "@/components/site/analytics-provider";
import { getSeoSettings, getSiteSettings } from "@/lib/queries";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-mono-face",
});

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoSettings(), getSiteSettings()]);

  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: {
      default: seo.siteTitle,
      template: seo.titleTemplate.includes("%s") ? seo.titleTemplate : `%s — ${seo.siteTitle}`,
    },
    description: seo.metaDescription || settings.description,
    applicationName: settings.companyName,
    authors: [{ name: settings.legalName }],
    creator: settings.legalName,
    publisher: settings.legalName,
    formatDetection: { telephone: false },
    icons: settings.faviconUrl
      ? { icon: settings.faviconUrl, shortcut: settings.faviconUrl, apple: settings.faviconUrl }
      : { icon: "/icon.svg", shortcut: "/icon.svg" },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#050507" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-dvh bg-ink-950 font-sans text-ink-50 antialiased">
        <style>{`:root{--accent:${sanitizeColor(settings.accentColor)};--accent-2:${sanitizeColor(
          settings.accentColor2,
        )};}`}</style>
        {children}

        <AnalyticsProvider
          provider={settings.analyticsProvider}
          id={settings.analyticsId}
        />

        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#0b0b0f",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e9e9ef",
            },
          }}
        />
      </body>
    </html>
  );
}

/** Only allow hex/rgb colour values from the CMS into the inline style tag. */
function sanitizeColor(value: string | null | undefined): string {
  if (!value) return "#5b8cff";
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : "#5b8cff";
}
