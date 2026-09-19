"use client";

import { useState } from "react";
import { Check, Link2, Linkedin } from "lucide-react";
import { SocialIcon } from "@/components/site/social-icon";
import { cn } from "@/lib/utils";

export function ShareButtons({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="grid size-8 place-items-center rounded-full border border-white/10 text-ink-300 transition-colors hover:border-white/30 hover:text-ink-50"
      >
        <SocialIcon name="x" className="size-3.5" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="grid size-8 place-items-center rounded-full border border-white/10 text-ink-300 transition-colors hover:border-white/30 hover:text-ink-50"
      >
        <Linkedin className="size-3.5" />
      </a>
      <button
        type="button"
        onClick={share}
        aria-label={copied ? "Link copied" : "Copy link"}
        className="grid size-8 place-items-center rounded-full border border-white/10 text-ink-300 transition-colors hover:border-white/30 hover:text-ink-50"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Link2 className="size-3.5" />}
      </button>
    </div>
  );
}
