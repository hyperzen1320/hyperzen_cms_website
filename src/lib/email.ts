import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "@/lib/db";

export type ResolvedEmailConfig = {
  enabled: boolean;
  host?: string;
  port: number;
  user?: string;
  password?: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
  notificationEmail?: string;
  replyTo?: string;
  source: "database" | "environment" | "none";
};

/**
 * Email settings live in the CMS (/admin/settings/email) and fall back to
 * environment variables. Credentials never leave the server.
 */
export async function getEmailConfig(): Promise<ResolvedEmailConfig> {
  const record = await prisma.emailSettings
    .findUnique({ where: { id: "singleton" } })
    .catch(() => null);

  const envHost = process.env.SMTP_HOST?.trim();
  const fromEnv = parseFrom(process.env.EMAIL_FROM);

  if (record?.enabled && record.smtpHost) {
    return {
      enabled: true,
      host: record.smtpHost,
      port: record.smtpPort ?? 587,
      user: record.smtpUser ?? undefined,
      password: record.smtpPassword ?? undefined,
      secure: record.smtpSecure,
      fromEmail: record.fromEmail || fromEnv.email || "no-reply@localhost",
      fromName: record.fromName || fromEnv.name || "Hyperzen Innovation",
      notificationEmail:
        record.notificationEmail || process.env.EMAIL_NOTIFICATION || record.fromEmail || undefined,
      replyTo: record.replyTo ?? undefined,
      source: "database",
    };
  }

  if (envHost) {
    return {
      enabled: true,
      host: envHost,
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER || undefined,
      password: process.env.SMTP_PASSWORD || undefined,
      secure: process.env.SMTP_SECURE === "true",
      fromEmail: fromEnv.email || "no-reply@localhost",
      fromName: fromEnv.name || "Hyperzen Innovation",
      notificationEmail: process.env.EMAIL_NOTIFICATION || fromEnv.email || undefined,
      source: "environment",
    };
  }

  return {
    enabled: false,
    port: 587,
    secure: false,
    fromEmail: fromEnv.email || "no-reply@localhost",
    fromName: fromEnv.name || "Hyperzen Innovation",
    notificationEmail: process.env.EMAIL_NOTIFICATION || record?.notificationEmail || undefined,
    source: "none",
  };
}

function parseFrom(value?: string | null): { name?: string; email?: string } {
  if (!value) return {};
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1] || undefined, email: match[2] };
  return { email: value.trim() };
}

let cachedTransporter: { key: string; transporter: Transporter } | null = null;

function getTransporter(config: ResolvedEmailConfig): Transporter | null {
  if (!config.enabled || !config.host) return null;
  const key = `${config.host}:${config.port}:${config.user ?? ""}:${config.secure}`;
  if (cachedTransporter?.key === key) return cachedTransporter.transporter;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    pool: true,
    maxConnections: 2,
  });

  cachedTransporter = { key, transporter };
  return transporter;
}

export type SendResult = { sent: boolean; skipped?: string; error?: string };

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const config = await getEmailConfig();
  const transporter = getTransporter(config);

  if (!transporter) {
    // Not an error: the site works fine without SMTP configured. Submissions are
    // always stored in the database and visible in /admin/leads.
    console.info(`[email] skipped (SMTP not configured) → ${options.subject}`);
    return { sent: false, skipped: "SMTP is not configured" };
  }

  try {
    await transporter.sendMail({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? stripHtml(options.html),
      replyTo: options.replyTo ?? config.replyTo,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error";
    console.error("[email] send failed:", message);
    return { sent: false, error: message };
  }
}

export async function verifySmtp(): Promise<{ ok: boolean; message: string }> {
  const config = await getEmailConfig();
  const transporter = getTransporter(config);
  if (!transporter) return { ok: false, message: "SMTP is not configured or is disabled." };
  try {
    await transporter.verify();
    return { ok: true, message: `Connected to ${config.host}:${config.port}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Connection failed." };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function layout(title: string, body: string, footer?: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111113;border:1px solid #1f1f23;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;">
          <div style="font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:#5B8CFF;font-weight:600;">Hyperzen</div>
          <h1 style="margin:14px 0 0;font-size:22px;line-height:1.3;color:#fafafa;font-weight:600;">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 28px;color:#a1a1aa;font-size:15px;line-height:1.65;">${body}</td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #1f1f23;color:#71717a;font-size:12px;line-height:1.6;">
          ${footer ?? "Hyperzen Innovation Pvt Ltd — Where ideas meet innovation."}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function row(label: string, value?: string | null): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:6px 0;color:#71717a;font-size:13px;width:132px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#e4e4e7;font-size:14px;">${escapeHtml(value)}</td>
  </tr>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type LeadEmailData = {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  service?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  sourcePage?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  adminUrl: string;
};

export function newLeadTemplate(data: LeadEmailData) {
  const body = `
    <p style="margin:0 0 18px;">A new enquiry just arrived from the website.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${row("Name", data.name)}
      ${row("Email", data.email)}
      ${row("Phone", data.phone)}
      ${row("Company", data.company)}
      ${row("Website", data.website)}
      ${row("Service", data.service)}
      ${row("Budget", data.budget)}
      ${row("Timeline", data.timeline)}
      ${row("Page", data.sourcePage)}
      ${row("UTM source", data.utmSource)}
      ${row("Campaign", data.utmCampaign)}
    </table>
    <div style="margin:20px 0 0;padding:16px;background:#0a0a0b;border:1px solid #1f1f23;border-radius:12px;color:#e4e4e7;font-size:14px;white-space:pre-wrap;">${escapeHtml(
      data.message,
    )}</div>
    <p style="margin:24px 0 0;">
      <a href="${data.adminUrl}" style="display:inline-block;background:#5B8CFF;color:#0a0a0b;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px;">Open in CRM</a>
    </p>`;
  return {
    subject: `New enquiry — ${data.name}${data.company ? ` (${data.company})` : ""}`,
    html: layout("New project enquiry", body),
  };
}

export function leadConfirmationTemplate(data: { name: string; companyName: string; email: string }) {
  const body = `
    <p style="margin:0 0 16px;">Hi ${escapeHtml(data.name.split(" ")[0] ?? data.name)},</p>
    <p style="margin:0 0 16px;">Thank you for reaching out to ${escapeHtml(
      data.companyName,
    )}. Your idea is now in motion — a member of our team will review the details and get back to you within one business day.</p>
    <p style="margin:0 0 16px;">In the meantime, feel free to reply to this email with anything else that would help us understand the project: existing systems, timelines, or the outcome you are aiming for.</p>
    <p style="margin:0;">— The ${escapeHtml(data.companyName)} team</p>`;
  return {
    subject: `We received your enquiry — ${data.companyName}`,
    html: layout("Your idea is now in motion", body),
  };
}

export function jobApplicationTemplate(data: {
  name: string;
  email: string;
  jobTitle: string;
  phone?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  resumeUrl?: string | null;
  message?: string | null;
  adminUrl: string;
}) {
  const body = `
    <p style="margin:0 0 18px;">A new application was submitted for <strong style="color:#fafafa;">${escapeHtml(
      data.jobTitle,
    )}</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${row("Name", data.name)}
      ${row("Email", data.email)}
      ${row("Phone", data.phone)}
      ${row("LinkedIn", data.linkedin)}
      ${row("Portfolio", data.portfolio)}
      ${row("Resume", data.resumeUrl)}
    </table>
    ${
      data.message
        ? `<div style="margin:20px 0 0;padding:16px;background:#0a0a0b;border:1px solid #1f1f23;border-radius:12px;color:#e4e4e7;font-size:14px;white-space:pre-wrap;">${escapeHtml(
            data.message,
          )}</div>`
        : ""
    }
    <p style="margin:24px 0 0;">
      <a href="${data.adminUrl}" style="display:inline-block;background:#5B8CFF;color:#0a0a0b;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px;">Review application</a>
    </p>`;
  return {
    subject: `Application — ${data.jobTitle} — ${data.name}`,
    html: layout("New job application", body),
  };
}

export function newsletterTemplate(data: { companyName: string; siteUrl: string }) {
  const body = `
    <p style="margin:0 0 16px;">You are subscribed to the ${escapeHtml(
      data.companyName,
    )} insights list.</p>
    <p style="margin:0 0 16px;">Expect occasional, genuinely useful notes on engineering, AI automation and digital product work — no noise.</p>
    <p style="margin:0;"><a href="${data.siteUrl}/insights" style="color:#5B8CFF;">Read the latest insights</a></p>`;
  return {
    subject: `You're subscribed — ${data.companyName}`,
    html: layout("Subscription confirmed", body),
  };
}
