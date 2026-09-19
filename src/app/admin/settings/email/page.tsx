import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getEmailConfig } from "@/lib/email";
import { PageHeader } from "@/components/admin/ui";
import { EmailSettingsPanel } from "@/components/admin/email-settings-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Email settings" };

export default async function EmailSettingsPage() {
  const user = await requireUser();
  if (!can(user.role, "settings.write")) notFound();

  const [record, resolved] = await Promise.all([
    prisma.emailSettings.findUnique({ where: { id: "singleton" } }),
    getEmailConfig(),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Email"
        description="SMTP credentials for enquiry notifications, confirmations and job applications. Credentials never leave the server."
      />

      <EmailSettingsPanel
        source={resolved.source}
        hasStoredPassword={Boolean(record?.smtpPassword)}
        values={{
          enabled: record?.enabled ?? false,
          smtpHost: record?.smtpHost ?? "",
          smtpPort: record?.smtpPort ?? 587,
          smtpUser: record?.smtpUser ?? "",
          smtpPassword: "",
          smtpSecure: record?.smtpSecure ?? false,
          fromEmail: record?.fromEmail ?? "",
          fromName: record?.fromName ?? "",
          notificationEmail: record?.notificationEmail ?? "",
          replyTo: record?.replyTo ?? "",
        }}
      />
    </div>
  );
}
