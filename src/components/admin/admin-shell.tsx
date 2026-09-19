"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { AdminIcon } from "@/components/admin/admin-icon";
import { NotificationBell, type BellItem } from "@/components/admin/notification-bell";
import { Logo } from "@/components/site/logo";
import { cn, initials } from "@/lib/utils";
import type { AdminNavGroup } from "@/lib/admin/nav";

type Props = {
  nav: AdminNavGroup[];
  user: { name: string; email: string; role: string; avatarUrl?: string | null };
  companyName: string;
  logoUrl?: string | null;
  logoAltUrl?: string | null;
  notifications: BellItem[];
  unreadCount: number;
  logout: () => Promise<void>;
  children: React.ReactNode;
};

export function AdminShell({
  nav,
  user,
  companyName,
  logoUrl,
  logoAltUrl,
  notifications,
  unreadCount,
  logout,
  children,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="admin min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-[var(--a-border)] bg-[var(--a-panel)] lg:flex">
        <SidebarContent nav={nav} pathname={pathname} companyName={companyName} logoUrl={logoUrl} logoAltUrl={logoAltUrl} />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-[var(--a-border)] bg-[var(--a-panel)] lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-3.5 grid size-8 place-items-center rounded-lg text-[var(--a-muted)] hover:bg-[var(--a-hover)]"
              >
                <X className="size-4" />
              </button>
              <SidebarContent
                nav={nav}
                pathname={pathname}
                companyName={companyName}
                logoUrl={logoUrl}
                logoAltUrl={logoAltUrl}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Main */}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-[var(--a-border)] bg-[color-mix(in_oklab,var(--a-bg)_88%,transparent)] backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid size-9 place-items-center rounded-lg border border-[var(--a-border)] text-[var(--a-fg)] lg:hidden"
            >
              <MenuIcon className="size-4" />
            </button>

            <Breadcrumbs pathname={pathname} />

            <div className="ml-auto flex items-center gap-1.5">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-3 py-1.5 text-[13px] text-[var(--a-muted)] transition-colors hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)] sm:inline-flex"
              >
                View site
                <ExternalLink className="size-3.5" />
              </Link>
              <NotificationBell items={notifications} unreadCount={unreadCount} />
              <ThemeToggle />
              <UserMenu user={user} logout={logout} />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  nav,
  pathname,
  companyName,
  logoUrl,
  logoAltUrl,
}: {
  nav: AdminNavGroup[];
  pathname: string;
  companyName: string;
  logoUrl?: string | null;
  logoAltUrl?: string | null;
}) {
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-[var(--a-border)] px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo url={logoUrl} altUrl={logoAltUrl} companyName={companyName} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {nav.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-2.5 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--a-subtle)]">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors",
                        active
                          ? "bg-[var(--a-active)] font-medium text-[var(--a-fg-strong)]"
                          : "text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-fg)]",
                      )}
                    >
                      {active ? (
                        <span
                          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full"
                          style={{ background: "var(--accent)" }}
                        />
                      ) : null}
                      <AdminIcon name={item.icon} className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[var(--a-border)] px-4 py-3">
        <p className="text-[11.5px] text-[var(--a-subtle)]">
          Hyperzen CMS · v1.0
        </p>
      </div>
    </>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean).slice(1);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-[13px]">
        <li>
          <Link href="/admin" className="text-[var(--a-muted)] hover:text-[var(--a-fg)]">
            CMS
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/admin/${segments.slice(0, index + 1).join("/")}`;
          const label = segment
            .replace(/-/g, " ")
            .replace(/^\w/, (char) => char.toUpperCase());
          const last = index === segments.length - 1;
          return (
            <li key={href} className="flex min-w-0 items-center gap-1.5">
              <span className="text-[var(--a-subtle)]">/</span>
              {last ? (
                <span className="truncate font-medium text-[var(--a-fg)]">{label}</span>
              ) : (
                <Link href={href} className="truncate text-[var(--a-muted)] hover:text-[var(--a-fg)]">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle colour theme"
      className="grid size-9 place-items-center rounded-lg border border-[var(--a-border)] text-[var(--a-muted)] transition-colors hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]"
    >
      {mounted && theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}

function UserMenu({
  user,
  logout,
}: {
  user: { name: string; email: string; role: string };
  logout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg border border-[var(--a-border)] py-1 pl-1 pr-2 transition-colors hover:border-[var(--a-border-strong)]"
      >
        <span
          className="grid size-7 place-items-center rounded-md text-[11.5px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          {initials(user.name)}
        </span>
        <ChevronDown className="size-3.5 text-[var(--a-muted)]" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            onClick={(event) => event.stopPropagation()}
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--a-border)] bg-[var(--a-elevated)] shadow-[var(--a-shadow)]"
          >
            <div className="border-b border-[var(--a-border)] px-4 py-3">
              <p className="truncate text-[13.5px] font-medium text-[var(--a-fg-strong)]">
                {user.name}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[var(--a-muted)]">{user.email}</p>
              <span className="mt-2 inline-block rounded-md border border-[var(--a-border)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--a-muted)]">
                {user.role.replace("_", " ")}
              </span>
            </div>
            <Link
              href="/admin/account"
              role="menuitem"
              className="block px-4 py-2.5 text-[13.5px] text-[var(--a-fg)] transition-colors hover:bg-[var(--a-hover)]"
            >
              My account
            </Link>
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] text-danger transition-colors hover:bg-[var(--a-hover)]"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
