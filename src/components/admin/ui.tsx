import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string } | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-fg-strong)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--a-muted)]">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {children}
        {action ? (
          <Link
            href={action.href}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            <Plus className="size-4" />
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)]",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-medium text-[var(--a-fg-strong)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[12.5px] text-[var(--a-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <>
      <p className="text-[12.5px] font-medium text-[var(--a-muted)]">{label}</p>
      <p
        className={cn(
          "mt-2 text-[26px] font-semibold tracking-tight",
          accent ? "text-[var(--accent)]" : "text-[var(--a-fg-strong)]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-[var(--a-subtle)]">{hint}</p> : null}
      {href ? (
        <ArrowUpRight className="absolute right-4 top-4 size-4 text-[var(--a-subtle)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      ) : null}
    </>
  );

  const className =
    "group relative rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)] p-5 transition-colors hover:border-[var(--a-border-strong)]";

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--a-border)] bg-[var(--a-panel)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
      </div>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-[var(--a-border)] bg-[var(--a-panel-2)] px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--a-muted)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-b border-[var(--a-border)] px-4 py-3 text-[13.5px]", className)}>
      {children}
    </td>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "border-success/35 bg-success/10 text-success",
  DRAFT: "border-warning/35 bg-warning/10 text-warning",
  ARCHIVED: "border-[var(--a-border)] bg-[var(--a-hover)] text-[var(--a-muted)]",
  NEW: "border-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]",
  CONTACTED: "border-warning/35 bg-warning/10 text-warning",
  QUALIFIED: "border-[color-mix(in_oklab,var(--accent-2)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent-2)_12%,transparent)] text-[var(--accent-2)]",
  PROPOSAL: "border-warning/35 bg-warning/10 text-warning",
  WON: "border-success/35 bg-success/10 text-success",
  LOST: "border-danger/35 bg-danger/10 text-danger",
  REVIEWING: "border-warning/35 bg-warning/10 text-warning",
  SHORTLISTED: "border-success/35 bg-success/10 text-success",
  REJECTED: "border-danger/35 bg-danger/10 text-danger",
  HIRED: "border-success/35 bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        STATUS_STYLES[status] ?? "border-[var(--a-border)] bg-[var(--a-hover)] text-[var(--a-muted)]",
      )}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "danger" | "warning";
}) {
  const tones: Record<string, string> = {
    neutral: "border-[var(--a-border)] text-[var(--a-muted)]",
    accent:
      "border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[var(--accent)]",
    success: "border-success/35 text-success",
    danger: "border-danger/35 text-danger",
    warning: "border-warning/35 text-warning",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--a-border-strong)] bg-[var(--a-panel)] px-6 py-14 text-center">
      <p className="text-[15px] font-medium text-[var(--a-fg-strong)]">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--a-muted)]">
          {description}
        </p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13.5px] font-medium text-white"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        >
          <Plus className="size-4" />
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-[var(--a-hover)]", className)}
      aria-hidden="true"
    />
  );
}

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-center gap-1.5">
      {pages.map((candidate, index) => (
        <span key={candidate} className="flex items-center gap-1.5">
          {index > 0 && candidate - pages[index - 1]! > 1 ? (
            <span className="px-1 text-[13px] text-[var(--a-subtle)]">…</span>
          ) : null}
          <Link
            href={buildHref(candidate)}
            aria-current={candidate === page ? "page" : undefined}
            className={cn(
              "grid size-9 place-items-center rounded-lg border text-[13px] transition-colors",
              candidate === page
                ? "border-[var(--a-border-strong)] bg-[var(--a-active)] text-[var(--a-fg-strong)]"
                : "border-[var(--a-border)] text-[var(--a-muted)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]",
            )}
          >
            {candidate}
          </Link>
        </span>
      ))}
    </nav>
  );
}
