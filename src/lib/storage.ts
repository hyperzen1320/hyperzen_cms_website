import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { MediaType } from "@prisma/client";

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 8) * 1024 * 1024;

const ALLOWED_MIME: Record<string, { ext: string; type: MediaType }> = {
  "image/jpeg": { ext: "jpg", type: "IMAGE" },
  "image/png": { ext: "png", type: "IMAGE" },
  "image/webp": { ext: "webp", type: "IMAGE" },
  "image/avif": { ext: "avif", type: "IMAGE" },
  "image/gif": { ext: "gif", type: "IMAGE" },
  "image/svg+xml": { ext: "svg", type: "IMAGE" },
  "video/mp4": { ext: "mp4", type: "VIDEO" },
  "video/webm": { ext: "webm", type: "VIDEO" },
  "application/pdf": { ext: "pdf", type: "DOCUMENT" },
};

export const ACCEPTED_UPLOAD_TYPES = Object.keys(ALLOWED_MIME).join(",");

/**
 * `local` writes into /public/uploads (default for local development and any
 * server with a writable disk). `db` stores the bytes in PostgreSQL and streams
 * them back through /api/media/[id] — the right choice on read-only serverless
 * filesystems such as Vercel.
 */
function driver(): "local" | "db" {
  const configured = process.env.MEDIA_STORAGE?.toLowerCase();
  if (configured === "db" || configured === "local") return configured;
  return process.env.VERCEL ? "db" : "local";
}

export type UploadResult = {
  ok: true;
  media: { id: string; url: string; filename: string; mimeType: string; size: number };
};
export type UploadError = { ok: false; error: string };

/** Basic magic-number sniffing so a renamed executable cannot pose as an image. */
function signatureMatches(mime: string, bytes: Buffer): boolean {
  const head = bytes.subarray(0, 16);
  const startsWith = (...sig: number[]) => sig.every((byte, index) => head[index] === byte);
  switch (mime) {
    case "image/jpeg":
      return startsWith(0xff, 0xd8, 0xff);
    case "image/png":
      return startsWith(0x89, 0x50, 0x4e, 0x47);
    case "image/gif":
      return startsWith(0x47, 0x49, 0x46, 0x38);
    case "image/webp":
      return startsWith(0x52, 0x49, 0x46, 0x46) && bytes.subarray(8, 12).toString() === "WEBP";
    case "image/avif":
      return bytes.subarray(4, 8).toString() === "ftyp";
    case "application/pdf":
      return startsWith(0x25, 0x50, 0x44, 0x46);
    case "video/mp4":
      return bytes.subarray(4, 8).toString() === "ftyp";
    case "video/webm":
      return startsWith(0x1a, 0x45, 0xdf, 0xa3);
    case "image/svg+xml": {
      const text = bytes.subarray(0, 512).toString("utf8").toLowerCase();
      return text.includes("<svg") || text.includes("<?xml");
    }
    default:
      return false;
  }
}

/** Remove scripting vectors from user-uploaded SVG files. */
function sanitizeSvg(buffer: Buffer): Buffer {
  const svg = buffer
    .toString("utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
  return Buffer.from(svg, "utf8");
}

export async function saveUpload(
  file: File,
  options: { userId?: string | null; alt?: string; folder?: string } = {},
): Promise<UploadResult | UploadError> {
  if (!file || typeof file.arrayBuffer !== "function") {
    return { ok: false, error: "No file received." };
  }
  if (file.size === 0) return { ok: false, error: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `Files must be ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB or smaller.` };
  }

  const descriptor = ALLOWED_MIME[file.type];
  if (!descriptor) {
    return { ok: false, error: `Unsupported file type "${file.type || "unknown"}".` };
  }

  // Kept as a Uint8Array backed by its own ArrayBuffer so it satisfies both the
  // Buffer helpers below and Prisma's Bytes column type.
  let bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureMatches(file.type, Buffer.from(bytes))) {
    return { ok: false, error: "The file contents do not match its type." };
  }
  if (file.type === "image/svg+xml") {
    bytes = new Uint8Array(sanitizeSvg(Buffer.from(bytes)));
  }
  const buffer = Buffer.from(bytes);

  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 60) || "file";
  const filename = `${base}-${randomUUID().slice(0, 8)}.${descriptor.ext}`;
  const dimensions = descriptor.type === "IMAGE" ? readImageSize(buffer, file.type) : null;
  const mode = driver();

  let url: string;
  if (mode === "local") {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    url = `/uploads/${filename}`;
  } else {
    url = ""; // filled in below once the row id exists
  }

  const media = await prisma.media.create({
    data: {
      filename,
      originalName: file.name.slice(0, 200),
      url,
      storage: mode,
      data: mode === "db" ? bytes : null,
      mimeType: file.type,
      type: descriptor.type,
      size: buffer.byteLength,
      width: dimensions?.width,
      height: dimensions?.height,
      alt: options.alt?.slice(0, 300) ?? null,
      folder: options.folder ?? "uploads",
      uploadedById: options.userId ?? null,
    },
  });

  if (mode === "db") {
    url = `/api/media/${media.id}`;
    await prisma.media.update({ where: { id: media.id }, data: { url } });
  }

  return {
    ok: true,
    media: {
      id: media.id,
      url: url || media.url,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
    },
  };
}

export async function deleteMedia(id: string): Promise<void> {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return;
  if (media.storage === "local") {
    const filePath = path.join(process.cwd(), "public", "uploads", media.filename);
    await unlink(filePath).catch(() => undefined);
  }
  await prisma.media.delete({ where: { id } });
}

/** Read intrinsic dimensions straight from the file header (no image library). */
function readImageSize(buffer: Buffer, mime: string): { width: number; height: number } | null {
  try {
    if (mime === "image/png" && buffer.length > 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mime === "image/gif" && buffer.length > 10) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    if (mime === "image/jpeg") {
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buffer[offset + 1]!;
        const length = buffer.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        offset += 2 + length;
      }
    }
    if (mime === "image/webp" && buffer.length > 30) {
      const format = buffer.subarray(12, 16).toString();
      if (format === "VP8 ") {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      }
      if (format === "VP8L") {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
    }
  } catch {
    return null;
  }
  return null;
}
