import { SiteHeader } from "@/components/site/site-header";
import { getNavigation, getSiteSettings } from "@/lib/queries";
import { asObject } from "@/lib/utils";
import type { NavLink } from "@/types";

/** Used until the CMS navigation is populated, so the site is never link-less. */
const FALLBACK_NAV: NavLink[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "services", label: "Services", href: "/services" },
  { id: "solutions", label: "Solutions", href: "/solutions" },
  { id: "industries", label: "Industries", href: "/industries" },
  { id: "products", label: "Products", href: "/products" },
  { id: "work", label: "Work", href: "/projects" },
  { id: "insights", label: "Insights", href: "/insights" },
  { id: "about", label: "About", href: "/about" },
];

export async function Header() {
  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()]);

  const headerItems = navigation.HEADER ?? [];
  const items: NavLink[] = headerItems.length
    ? headerItems.map((item) => ({
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        badge: item.badge,
        description: item.description,
        openInNewTab: item.openInNewTab,
        children: item.children.map((child) => ({
          id: child.id,
          label: child.label,
          href: child.href,
          icon: child.icon,
          badge: child.badge,
          description: child.description,
          openInNewTab: child.openInNewTab,
        })),
      }))
    : FALLBACK_NAV;

  const announcement = asObject<{ enabled?: boolean; text?: string; url?: string }>(
    settings.announcement,
    {},
  );

  return (
    <SiteHeader
      items={items}
      companyName={settings.companyName}
      logoUrl={settings.logoUrl}
      announcement={
        announcement.enabled && announcement.text
          ? { text: announcement.text, url: announcement.url }
          : null
      }
    />
  );
}
