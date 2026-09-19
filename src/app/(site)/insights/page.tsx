import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionShell } from "@/components/sections/section-shell";
import { PostCard } from "@/components/site/cards";
import { JsonLdScript } from "@/components/site/json-ld";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { countPosts, getCategories, getPosts } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

type Props = {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Insights",
    description:
      "Notes on engineering, applied AI, automation and building digital products from the Hyperzen team.",
    path: "/insights",
  });
}

export default async function InsightsPage({ searchParams }: Props) {
  const { category, q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const [posts, total, categories] = await Promise.all([
    getPosts({
      categorySlug: category,
      query: q,
      limit: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    countPosts({ categorySlug: category, query: q }),
    getCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCategories = categories.filter((item) => item._count.posts > 0);

  const buildHref = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged = { category, q, ...params };
    for (const [key, value] of Object.entries(merged)) {
      if (value) search.set(key, value);
    }
    const query = search.toString();
    return query ? `/insights?${query}` : "/insights";
  };

  return (
    <>
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Insights", href: "/insights" },
        ])}
      />

      <PageHero
        eyebrow="Insights"
        title="Notes from the"
        highlight="engineering floor."
        description="Practical writing on how we build: architecture decisions, applied AI, performance and the trade-offs behind them."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Insights", href: "/insights" },
        ]}
      />

      <SectionShell>
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
            <Link
              href={buildHref({ category: undefined, page: undefined })}
              className={cn(
                "rounded-full border px-4 py-2 text-[13.5px] transition-colors duration-300",
                !category
                  ? "border-white/35 bg-white/[0.08] text-ink-50"
                  : "border-white/12 text-ink-300 hover:border-white/28 hover:text-ink-50",
              )}
            >
              All
            </Link>
            {activeCategories.map((item) => (
              <Link
                key={item.id}
                href={buildHref({ category: item.slug, page: undefined })}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13.5px] transition-colors duration-300",
                  category === item.slug
                    ? "border-white/35 bg-white/[0.08] text-ink-50"
                    : "border-white/12 text-ink-300 hover:border-white/28 hover:text-ink-50",
                )}
              >
                {item.name}
                <span className="ml-1.5 text-ink-500">{item._count.posts}</span>
              </Link>
            ))}
          </nav>

          <form action="/insights" method="get" className="lg:w-72">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.02] px-4 transition-colors focus-within:border-white/30">
              <Search className="size-4 shrink-0 text-ink-400" />
              <label htmlFor="insights-search" className="sr-only">
                Search insights
              </label>
              <input
                id="insights-search"
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search articles"
                className="h-10 w-full bg-transparent text-[14px] text-ink-50 outline-none placeholder:text-ink-500"
              />
            </div>
          </form>
        </div>

        {q ? (
          <p className="mb-6 text-[14px] text-ink-300">
            {total} {total === 1 ? "result" : "results"} for “{q}”
          </p>
        ) : null}

        {posts.length ? (
          <RevealGroup className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" as="ul">
            {posts.map((post, index) => (
              <RevealItem
                as="li"
                key={post.id}
                className={index === 0 && currentPage === 1 && !q ? "md:col-span-2" : ""}
              >
                <PostCard post={post} featured={index === 0 && currentPage === 1 && !q} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/12 p-12 text-center">
            <p className="text-[16px] font-medium text-ink-100">Nothing here yet.</p>
            <p className="mx-auto mt-3 max-w-md text-[14.5px] text-ink-300">
              {q
                ? "Try a different search term, or browse all articles."
                : "Publish articles from the CMS under Content → Insights."}
            </p>
            {q ? (
              <Link
                href="/insights"
                className="mt-6 inline-flex h-11 items-center rounded-full border border-white/15 px-6 text-[14px] text-ink-100 transition-colors hover:border-white/35"
              >
                Clear search
              </Link>
            ) : null}
          </div>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            className="mt-12 flex items-center justify-center gap-2"
          >
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <Link
                  key={pageNumber}
                  href={buildHref({ page: pageNumber === 1 ? undefined : String(pageNumber) })}
                  aria-current={pageNumber === currentPage ? "page" : undefined}
                  className={cn(
                    "grid size-10 place-items-center rounded-full border text-[13.5px] transition-colors",
                    pageNumber === currentPage
                      ? "border-white/35 bg-white/[0.08] text-ink-50"
                      : "border-white/12 text-ink-300 hover:border-white/28 hover:text-ink-50",
                  )}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </SectionShell>
    </>
  );
}
