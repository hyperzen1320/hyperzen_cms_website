import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  const user = await requireUser();
  if (!can(user.role, "media.write")) notFound();

  const [media, aggregate, imageCount, videoCount] = await Promise.all([
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        url: true,
        filename: true,
        originalName: true,
        mimeType: true,
        type: true,
        size: true,
        width: true,
        height: true,
        alt: true,
        title: true,
        storage: true,
        createdAt: true,
      },
    }),
    prisma.media.aggregate({ _sum: { size: true }, _count: { _all: true } }),
    prisma.media.count({ where: { type: "IMAGE" } }),
    prisma.media.count({ where: { type: "VIDEO" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Media"
        description="Images, video and documents used across the website. Files uploaded here are available in every content editor."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <StatCard label="Files" value={aggregate._count._all} />
        <StatCard label="Images" value={imageCount} />
        <StatCard label="Video" value={videoCount} />
        <StatCard label="Storage used" value={formatBytes(aggregate._sum.size ?? 0)} />
      </div>

      <MediaLibrary
        items={media.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
        canDelete={can(user.role, "media.delete")}
      />
    </div>
  );
}
