import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AdminShell } from "@/components/admin/admin-shell";
import { logoutAction } from "@/app/admin/logout-action";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { getSiteSettings } from "@/lib/queries";
import { getRecentNotifications, getUnreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "CMS", template: "%s — Hyperzen CMS" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const settings = await getSiteSettings();

  // The login page renders inside this layout too; it has no shell.
  if (!user) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    );
  }

  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(8),
    getUnreadCount(),
  ]);

  const nav = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.capability || can(user.role, item.capability)),
  })).filter((group) => group.items.length > 0);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AdminShell
        nav={nav}
        user={{
          name: user.name,
          email: user.email,
          role: user.role.name,
          avatarUrl: user.avatarUrl,
        }}
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        logoAltUrl={settings.logoDarkUrl}
        notifications={notifications.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          href: item.href,
          readAt: item.readAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        }))}
        unreadCount={unreadCount}
        logout={logoutAction}
      >
        {children}
      </AdminShell>
    </ThemeProvider>
  );
}
