import Link from "next/link";
import { Eye } from "lucide-react";

/**
 * Shown at the top of a page rendered with ?preview=1 so an editor always knows
 * they are looking at unpublished content.
 */
export function PreviewBanner({ status, editHref }: { status?: string; editHref?: string }) {
  return (
    <div className="sticky top-0 z-[110] border-b border-warning/30 bg-warning/10 backdrop-blur">
      <div className="container-page flex flex-wrap items-center gap-3 py-2 text-[13px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-warning">
          <Eye className="size-3.5" />
          Preview mode
        </span>
        <span className="text-ink-200">
          You are viewing {status ? status.toLowerCase() : "unpublished"} content. Visitors cannot
          see this page.
        </span>
        {editHref ? (
          <Link
            href={editHref}
            className="ml-auto rounded-full border border-warning/40 px-3 py-1 text-[12.5px] font-medium text-warning transition-colors hover:bg-warning/10"
          >
            Edit in CMS
          </Link>
        ) : null}
      </div>
    </div>
  );
}
