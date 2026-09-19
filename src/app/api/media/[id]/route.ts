import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Streams media stored in PostgreSQL (used when MEDIA_STORAGE=db). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const media = await prisma.media.findUnique({
    where: { id },
    select: { data: true, mimeType: true, filename: true, url: true, storage: true },
  });

  if (!media) return new NextResponse("Not found", { status: 404 });

  if (media.storage !== "db" || !media.data) {
    return NextResponse.redirect(new URL(media.url, "http://localhost"), 302);
  }

  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${media.filename.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
