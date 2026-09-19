import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageSettingsForm } from "@/components/admin/page-settings-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New page" };

export default async function NewPagePage() {
  const user = await requireUser();
  if (!can(user.role, "content.write")) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/pages"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--a-muted)] transition-colors hover:text-[var(--a-fg)]"
      >
        <ArrowLeft className="size-3.5" />
        All pages
      </Link>

      <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-[var(--a-fg-strong)]">
        New page
      </h1>
      <p className="mb-6 text-[13.5px] text-[var(--a-muted)]">
        Save the page first, then compose it from blocks.
      </p>

      <PageSettingsForm page={null} canDelete={false} />
    </div>
  );
}
