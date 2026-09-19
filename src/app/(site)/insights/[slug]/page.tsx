/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, User } from "lucide-react";
import { SectionShell } from "@/components/sections/section-shell";
import { CtaBlock } from "@/components/sections/content-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { PostCard } from "@/components/site/cards";
import { JsonLdScript } from "@/components/site/json-ld";
import { ShareButtons } from "@/components/site/share-buttons";
import { Reveal } from "@/components/ui/reveal";
import { getPostBySlug, getRelatedPosts, getSiteSettings } from "@/lib/queries";
import { articleSchema, breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { sanitizeRichText } from "@/lib/sanitize";
import { absoluteUrl, formatDate } from "@/lib/utils";
import { isPreview } from "@/lib/preview";
import { PreviewBanner } from "@/components/site/preview-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return buildMetadata({ title: "Article not found", noIndex: true });

  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/insights/${post.slug}`,
    image: post.ogImage || post.coverUrl,
    noIndex: post.noIndex,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authors: post.authorName ? [post.authorName] : undefined,
  });
}

export default async function InsightPage({ params, searchParams }: Props) {
  const [{ slug }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const preview = await isPreview(previewParam);
  const [post, settings] = await Promise.all([getPostBySlug(slug, preview), getSiteSettings()]);
  if (!post) notFound();

  const related = await getRelatedPosts(post.id, post.categoryId, 3);
  const html = sanitizeRichText(post.content);

  return (
    <>
      {preview ? (
        <PreviewBanner
          status={post.status}
          editHref={`/admin/insights/${post.id}`}
        />
      ) : null}

      <JsonLdScript
        data={articleSchema({
          title: post.title,
          description: post.excerpt ?? "",
          slug: post.slug,
          image: post.coverUrl,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          authorName: post.authorName,
          publisherName: settings.companyName,
        })}
      />
      <JsonLdScript
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Insights", href: "/insights" },
          { name: post.title, href: `/insights/${post.slug}` },
        ])}
      />

      <PageHero
        eyebrow={post.category?.name ?? "Insight"}
        title={post.title}
        description={post.excerpt}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Insights", href: "/insights" },
          { name: post.title, href: `/insights/${post.slug}` },
        ]}
      />

      <SectionShell settings={{ spacing: "compact" }}>
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/8 pb-6 text-[13px] text-ink-300">
            {post.authorName ? (
              <span className="flex items-center gap-1.5">
                <User className="size-3.5 text-ink-400" />
                {post.authorName}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-ink-400" />
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-ink-400" />
              {post.readingMinutes} min read
            </span>
            <ShareButtons
              url={absoluteUrl(`/insights/${post.slug}`)}
              title={post.title}
              className="ml-auto"
            />
          </div>

          {post.coverUrl ? (
            <Reveal>
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/8">
                <img src={post.coverUrl} alt={post.title} className="w-full object-cover" />
              </div>
            </Reveal>
          ) : null}

          <article
            className="prose prose-invert prose-hyperzen mt-10 max-w-none prose-headings:tracking-tight prose-h2:mt-12 prose-h2:text-[26px] prose-h3:text-[20px] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {post.tags.length ? (
            <ul className="mt-12 flex flex-wrap gap-2 border-t border-white/8 pt-8">
              {post.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12.5px] text-ink-300"
                >
                  #{tag.name}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-10 flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-5">
            <p className="text-[14px] text-ink-200">Found this useful? Share it.</p>
            <ShareButtons url={absoluteUrl(`/insights/${post.slug}`)} title={post.title} />
          </div>
        </div>
      </SectionShell>

      {related.length ? (
        <SectionShell settings={{ background: "subtle" }}>
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-tight text-ink-50">
              Related reading
            </h2>
            <Link href="/insights" className="text-[13.5px] text-ink-300 hover:text-ink-50">
              All insights
            </Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <PostCard post={item} />
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      <CtaBlock
        content={{
          title: "Have a problem worth solving?",
          description: "We would rather talk about your system than write about ours.",
          ctaLabel: settings.primaryCtaLabel,
          ctaUrl: settings.primaryCtaUrl,
        }}
      />
    </>
  );
}
