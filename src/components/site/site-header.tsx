"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, LogIn, Menu, X } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Magnetic } from "@/components/ui/magnetic";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";
import type { NavLink } from "@/types";

type Props = {
  items: NavLink[];
  companyName: string;
  logoUrl?: string | null;
  announcement?: { text: string; url?: string } | null;
};

export function SiteHeader({ items, companyName, logoUrl, announcement }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-ink-50 focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-ink-950"
      >
        Skip to content
      </a>

      {announcement?.text ? (
        <div className="relative z-50 border-b border-white/8 bg-ink-900/80 text-center">
          <div className="container-page flex items-center justify-center gap-2 py-2 text-[13px] text-ink-100">
            <span className="inline-block size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <span className="truncate">{announcement.text}</span>
            {announcement.url ? (
              <Link
                href={announcement.url}
                className="inline-flex shrink-0 items-center gap-1 font-medium text-ink-50 underline-offset-4 hover:underline"
              >
                Learn more <ArrowUpRight className="size-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-[100] w-full transition-all duration-500",
          scrolled
            ? "border-b border-white/8 bg-ink-950/70 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent",
        )}
        onMouseLeave={scheduleClose}
      >
        <div className="container-page">
          <div
            className={cn(
              "flex items-center justify-between gap-6 transition-[height] duration-500",
              scrolled ? "h-16" : "h-20",
            )}
          >
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2.5"
              aria-label={`${companyName} — home`}
            >
              <Logo url={logoUrl} companyName={companyName} />
            </Link>

            <nav className="hidden items-center lg:flex" aria-label="Primary">
              <ul className="flex items-center gap-1">
                {items.map((item) => {
                  const hasChildren = Boolean(item.children?.length);
                  const active = isActive(item.href);
                  return (
                    <li
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => {
                        cancelClose();
                        setOpenMenu(hasChildren ? item.id : null);
                      }}
                    >
                      <Link
                        href={item.href}
                        aria-expanded={hasChildren ? openMenu === item.id : undefined}
                        aria-haspopup={hasChildren ? "true" : undefined}
                        className={cn(
                          "relative flex items-center gap-1 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-300",
                          active ? "text-ink-50" : "text-ink-200 hover:text-ink-50",
                        )}
                        onFocus={() => setOpenMenu(hasChildren ? item.id : null)}
                      >
                        {active ? (
                          <motion.span
                            layoutId="nav-pill"
                            className="absolute inset-0 -z-10 rounded-full bg-white/[0.07]"
                            transition={
                              reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                            }
                          />
                        ) : null}
                        {item.label}
                        {hasChildren ? (
                          <ChevronDown
                            className={cn(
                              "size-3.5 transition-transform duration-300",
                              openMenu === item.id && "rotate-180",
                            )}
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              {/* One door. The portal itself offers sign in or create account. */}
              <Magnetic className="hidden sm:inline-flex">
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-50 px-4 text-[13px] font-semibold text-ink-950 transition-all duration-300 hover:bg-white hover:shadow-[0_12px_32px_-14px_rgba(255,255,255,0.5)]"
                >
                  <LogIn className="size-3.5" />
                  Sign in
                </Link>
              </Magnetic>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-ink-50 transition-colors hover:border-white/25 lg:hidden"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {openMenu ? (
            <MegaMenu
              item={items.find((item) => item.id === openMenu)!}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              reduce={Boolean(reduce)}
            />
          ) : null}
        </AnimatePresence>
      </header>

      <MobileNav open={mobileOpen} items={items} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function MegaMenu({
  item,
  onMouseEnter,
  onMouseLeave,
  reduce,
}: {
  item: NavLink;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  reduce: boolean;
}) {
  if (!item?.children?.length) return null;
  const columns = item.children.length > 6 ? 3 : 2;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute inset-x-0 top-full hidden border-b border-white/8 bg-ink-950/95 backdrop-blur-2xl lg:block"
    >
      <div className="container-page grid gap-8 py-8 xl:grid-cols-[1fr_auto]">
        <ul
          className={cn(
            "grid gap-1",
            columns === 3 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2",
          )}
        >
          {item.children.map((child) => (
            <li key={child.id}>
              <Link
                href={child.href}
                className="group flex items-start gap-3.5 rounded-xl p-3.5 transition-colors duration-300 hover:bg-white/[0.05]"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[var(--accent)] transition-colors duration-300 group-hover:border-[color-mix(in_oklab,var(--accent)_45%,transparent)]">
                  <Icon name={child.icon} className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[14px] font-medium text-ink-50">
                    {child.label}
                    {child.badge ? (
                      <span className="rounded-full border border-[color-mix(in_oklab,var(--accent)_40%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                        {child.badge}
                      </span>
                    ) : null}
                  </span>
                  {child.description ? (
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-200">
                      {child.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden w-72 shrink-0 flex-col justify-between rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.05] to-transparent p-6 xl:flex">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {item.label}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-100">
              Not sure where to start? Tell us the outcome you need and we will map the shortest
              route to it.
            </p>
          </div>
          <Link
            href={item.href}
            className="group mt-6 inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-50"
          >
            View all {item.label.toLowerCase()}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function MobileNav({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: NavLink[];
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex flex-col bg-ink-950 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <div className="container-page flex h-20 shrink-0 items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-[0.28em] text-ink-200">
              Menu
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-ink-50"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <nav className="container-page flex-1 overflow-y-auto pb-8" aria-label="Mobile">
            <ul className="divide-y divide-white/8">
              {items.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="py-1"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex-1 py-4 text-[22px] font-medium tracking-tight text-ink-50"
                    >
                      {item.label}
                    </Link>
                    {item.children?.length ? (
                      <button
                        type="button"
                        aria-label={`Toggle ${item.label} links`}
                        aria-expanded={expanded === item.id}
                        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-ink-100"
                      >
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-300",
                            expanded === item.id && "rotate-180",
                          )}
                        />
                      </button>
                    ) : null}
                  </div>

                  <AnimatePresence initial={false}>
                    {expanded === item.id && item.children?.length ? (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className="flex items-center gap-3 py-3 pl-1 text-[15px] text-ink-200"
                            >
                              <Icon name={child.icon} className="size-4 text-[var(--accent)]" />
                              {child.label}
                            </Link>
                          </li>
                        ))}
                        <li className="h-2" />
                      </motion.ul>
                    ) : null}
                  </AnimatePresence>
                </motion.li>
              ))}
            </ul>

            <Link
              href="/login"
              onClick={onClose}
              className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink-50 px-6 text-[14px] font-semibold text-ink-950"
            >
              <LogIn className="size-4" />
              Sign in
            </Link>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
