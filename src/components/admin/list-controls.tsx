"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Debounced search box that writes to the URL so results stay shareable. */
export function AdminSearch({ placeholder = "Search" }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("page");
      startTransition(() => router.replace(`?${params.toString()}`, { scroll: false }));
    }, 300);

    return () => clearTimeout(timer);
  }, [value, router, searchParams]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--a-subtle)]" />
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="admin-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="a-input pl-9 pr-9"
      />
      {pending ? (
        <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-[var(--a-subtle)]" />
      ) : value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-[var(--a-subtle)] hover:text-[var(--a-fg)]"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

const STATUSES = [
  { value: "", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

export function StatusFilter({
  counts,
  total,
}: {
  counts: Record<string, number>;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("status") ?? "";

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {STATUSES.map((option) => {
        const count = option.value ? (counts[option.value] ?? 0) : total;
        return (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => select(option.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors",
              active === option.value
                ? "border-[var(--a-border-strong)] bg-[var(--a-active)] text-[var(--a-fg-strong)]"
                : "border-[var(--a-border)] text-[var(--a-muted)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]",
            )}
          >
            {option.label}
            <span className="ml-1.5 tabular-nums text-[var(--a-subtle)]">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Generic filter pills driven by a list of options. */
export function FilterPills({
  param,
  options,
  allLabel = "All",
}: {
  param: string;
  options: { value: string; label: string; count?: number }[];
  allLabel?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? "";

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(param, value);
    else params.delete(param);
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {[{ value: "", label: allLabel }, ...options].map((option) => (
        <button
          key={option.value || "all"}
          type="button"
          onClick={() => select(option.value)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors",
            active === option.value
              ? "border-[var(--a-border-strong)] bg-[var(--a-active)] text-[var(--a-fg-strong)]"
              : "border-[var(--a-border)] text-[var(--a-muted)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-fg)]",
          )}
        >
          {option.label}
          {"count" in option && option.count !== undefined ? (
            <span className="ml-1.5 tabular-nums text-[var(--a-subtle)]">{option.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
