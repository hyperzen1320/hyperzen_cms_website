import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { searchSite } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search: ${q}` : "Search",
    description: "Search services, solutions, industries, products, work and insights.",
    path: "/search",
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query.length >= 2 ? await searchSite(query, 20) : [];

  return (
    <>
      <PageHero
        eyebrow="Search"
        title="Find what you need"
        description="Search across services, solutions, industries, products, case studies and insights."
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Search", href: "/search" },
        ]}
      />

      <SectionShell>
        <form action="/search" method="get" className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3 rounded-full border border-white/12 bg-white/[0.02] px-5 transition-colors focus-within:border-white/30">
            <Search className="size-4 shrink-0 text-ink-400" />
            <label htmlFor="site-search" className="sr-only">
              Search query
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              defaultValue={query}
              autoFocus
              placeholder="Search services, work, insights…"
              className="h-13 w-full bg-transparent text-[15px] text-ink-50 outline-none placeholder:text-ink-500"
            />
          </div>
        </form>

        <div className="mx-auto mt-10 max-w-2xl">
          {query.length < 2 ? (
            <p className="text-center text-[14.5px] text-ink-400">
              Type at least two characters to search.
            </p>
          ) : results.length ? (
            <>
              <p className="mb-5 text-[13.5px] text-ink-400">
                {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
              </p>
              <ul className="divide-y divide-white/8 border-y border-white/8">
                {results.map((result) => (
                  <li key={`${result.type}-${result.href}`}>
                    <Link
                      href={result.href}
                      className="group flex items-start gap-4 py-5 transition-colors"
                    >
                      <span className="mt-0.5 shrink-0 rounded-md border border-white/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-300">
                        {result.type}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-medium text-ink-50 transition-colors group-hover:text-white">
                          {result.title}
                        </span>
                        {result.description ? (
                          <span className="mt-1 block text-[14px] leading-relaxed text-ink-300">
                            {result.description}
                          </span>
                        ) : null}
                      </span>
                      <ArrowUpRight className="mt-1 size-4 shrink-0 text-ink-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 p-10 text-center">
              <p className="text-[15.5px] font-medium text-ink-100">No matches for “{query}”.</p>
              <p className="mt-2.5 text-[14px] text-ink-400">
                Try a broader term, or{" "}
                <Link href="/contact" className="text-ink-200 underline-offset-4 hover:underline">
                  ask us directly
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </SectionShell>
    </>
  );
}
