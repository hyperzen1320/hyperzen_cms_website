import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { saveUpload } from "@/lib/storage";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Media library listing for the CMS picker. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorised" }, { status: 401 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type") ?? "";
  const take = Math.min(60, Number(url.searchParams.get("take")) || 40);

  const media = await prisma.media.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { filename: { contains: query, mode: "insensitive" as const } },
              { originalName: { contains: query, mode: "insensitive" as const } },
              { alt: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(type ? { type: type as "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
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
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, media });
}

/** Upload endpoint used by the media library and every image field. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorised" }, { status: 401 });
  if (!can(user.role, "media.write")) {
    return NextResponse.json({ ok: false, message: "Not permitted" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, message: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "No file received." }, { status: 400 });
  }

  const result = await saveUpload(file, {
    userId: user.id,
    alt: String(formData.get("alt") ?? "") || undefined,
  });

  if (!result.ok) return NextResponse.json(result, { status: 422 });

  await notify({
    kind: "MEDIA",
    title: `Media uploaded — ${result.media.filename}`,
    body: `${Math.round(result.media.size / 1024)} KB · ${result.media.mimeType}`,
    href: "/admin/media",
    entityType: "media",
    entityId: result.media.id,
  });

  return NextResponse.json(result);
}
