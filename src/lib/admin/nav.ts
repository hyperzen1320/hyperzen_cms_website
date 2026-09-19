import type { Capability } from "@/lib/rbac";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  capability?: Capability;
  exact?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

/** Sidebar structure for the CMS. Items are filtered by the signed-in role. */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", exact: true },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: "Bell",
        capability: "notifications.read",
      },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Homepage", href: "/admin/homepage", icon: "Home", capability: "content.write" },
      { label: "Pages", href: "/admin/pages", icon: "Files", capability: "content.write" },
      { label: "Services", href: "/admin/services", icon: "Sparkles", capability: "content.read" },
      { label: "Solutions", href: "/admin/solutions", icon: "Layers", capability: "content.read" },
      { label: "Industries", href: "/admin/industries", icon: "Building2", capability: "content.read" },
      { label: "Products", href: "/admin/products", icon: "Package", capability: "content.read" },
      { label: "Projects", href: "/admin/projects", icon: "FolderKanban", capability: "content.read" },
      { label: "Testimonials", href: "/admin/testimonials", icon: "Quote", capability: "content.read" },
      { label: "Insights", href: "/admin/insights", icon: "Newspaper", capability: "content.read" },
      { label: "Categories", href: "/admin/categories", icon: "Tags", capability: "content.read" },
      { label: "Careers", href: "/admin/careers", icon: "Briefcase", capability: "content.read" },
      { label: "FAQs", href: "/admin/faqs", icon: "MessageCircleQuestion", capability: "content.read" },
      { label: "Media", href: "/admin/media", icon: "Image", capability: "media.write" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Leads", href: "/admin/leads", icon: "Users", capability: "leads.read" },
      { label: "Applications", href: "/admin/applications", icon: "FileUser", capability: "leads.read" },
      { label: "Newsletter", href: "/admin/newsletter", icon: "Mail", capability: "marketing.read" },
      { label: "Analytics", href: "/admin/analytics", icon: "BarChart3", capability: "analytics.read" },
    ],
  },
  {
    title: "Website",
    items: [
      { label: "Navigation", href: "/admin/navigation", icon: "Menu", capability: "website.write" },
      { label: "Footer & CTA", href: "/admin/footer", icon: "PanelBottom", capability: "website.write" },
      { label: "SEO", href: "/admin/seo", icon: "Radar", capability: "website.write" },
      { label: "Social links", href: "/admin/social", icon: "Share2", capability: "website.write" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "General", href: "/admin/settings", icon: "Settings", capability: "settings.write", exact: true },
      { label: "Branding", href: "/admin/settings/branding", icon: "Palette", capability: "settings.write" },
      { label: "Email", href: "/admin/settings/email", icon: "Send", capability: "settings.write" },
      { label: "Staff accounts", href: "/admin/settings/users", icon: "Shield", capability: "users.manage" },
      { label: "Roles", href: "/admin/settings/roles", icon: "KeyRound", capability: "roles.manage" },
      { label: "My account", href: "/admin/account", icon: "UserCog" },
    ],
  },
];
