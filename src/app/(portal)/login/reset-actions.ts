"use server";

import { createHash, randomBytes, randomInt } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { clientIpFrom, hashPassword } from "@/lib/auth";
import { destroyPortalSession } from "@/lib/portal-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getEmailConfig, sendEmail } from "@/lib/email";
import { maskEmail, maskNumber, sendSms, smsConfigured } from "@/lib/sms";
import { getSiteSettings } from "@/lib/queries";
import type { ActionResult } from "@/types";
import type { OtpChannel } from "@prisma/client";

/**
 * Password reset by one-time code.
 *
 * Three steps: ask for a code, prove you received it, then set a new password.
 * The code is never stored in the clear, expires in ten minutes, and allows
 * five wrong guesses before it is burned. Whether an account exists is never
 * revealed — every request reports success.
 */

const CODE_TTL_MINUTES = 10;
const RESET_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESET_COOKIE = "hz_reset";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Cryptographically random, so a code can never be guessed from the clock. */
function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type ResetRequestState = ActionResult<{
  channel: OtpChannel;
  destination: string;
  smsAvailable: boolean;
}>;

/**
 * Step one — send the code.
 *
 * Accepts an email address or a phone number. The reply is deliberately
 * identical whether or not an account matched.
 */
export async function requestResetCodeAction(payload: {
  identifier: string;
  channel?: OtpChannel;
}): Promise<ResetRequestState> {
  const headerList = await headers();
  const ip = clientIpFrom(headerList) ?? "unknown";

  const limit = rateLimit(`reset:${ip}`, 5, 15 * 60_000);
  if (!limit.success) {
    return { ok: false, message: "Too many requests. Please wait a few minutes and try again." };
  }

  const identifier = payload.identifier?.trim();
  if (!identifier) {
    return { ok: false, message: "Enter your email address or phone number." };
  }

  // With no way to deliver a code, say so rather than claiming one was sent and
  // leaving the person waiting for something that can never arrive.
  //
  // In development the flow still runs and the code is printed to the terminal,
  // so the whole journey can be exercised before SMTP is set up.
  const emailConfig = await getEmailConfig();
  const canDeliver = emailConfig.enabled || smsConfigured();
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (!canDeliver && !isDevelopment) {
    const settings = await getSiteSettings();
    return {
      ok: false,
      message: settings.email
        ? `Password reset by code is not available yet. Please contact ${settings.email}.`
        : "Password reset by code is not available yet. Please contact your account manager.",
    };
  }

  const looksLikeEmail = identifier.includes("@");
  const digits = identifier.replace(/[^\d]/g, "");

  const user = looksLikeEmail
    ? await prisma.erpUser.findUnique({ where: { email: identifier.toLowerCase() } })
    : digits.length >= 6
      ? await prisma.erpUser.findFirst({
          where: { phone: { contains: digits.slice(-10) } },
        })
      : null;

  // Same answer either way — an attacker learns nothing about who has an account.
  const generic: ResetRequestState = {
    ok: true,
    message: canDeliver
      ? "If that matches an account, a six-digit code is on its way."
      : "Email is not configured yet, so the code was printed to your dev server terminal.",
    data: {
      channel: looksLikeEmail ? "EMAIL" : "SMS",
      destination: looksLikeEmail ? maskEmail(identifier) : maskNumber(identifier),
      smsAvailable: smsConfigured(),
    },
  };

  if (!user || user.status === "SUSPENDED") return generic;

  // Only send by text when a number is on file and a gateway is configured.
  const wantsSms = payload.channel === "SMS" || (!looksLikeEmail && smsConfigured());
  const channel: OtpChannel = wantsSms && user.phone && smsConfigured() ? "SMS" : "EMAIL";
  const destination = channel === "SMS" ? user.phone! : user.email;

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  // One live code per person: asking again replaces the last one.
  await prisma.passwordResetCode.deleteMany({ where: { userId: user.id, consumedAt: null } });
  await prisma.passwordResetCode.create({
    data: {
      userId: user.id,
      channel,
      destination,
      codeHash: hash(code),
      expiresAt,
      ip,
    },
  });

  if (isDevelopment) {
    console.info(
      `
  ┌─ password reset code ─────────────────────────────
  │  ${user.email}
  │  code: ${code}   (expires in ${CODE_TTL_MINUTES} min)
  │  development only — never printed in production
  └───────────────────────────────────────────────────
`,
    );
  }

  const settings = await getSiteSettings();

  if (channel === "SMS") {
    const result = await sendSms(
      destination,
      `${code} is your ${settings.companyName} verification code. It expires in ${CODE_TTL_MINUTES} minutes.`,
    );
    if (!result.sent) {
      // Fall back to email rather than leaving them stranded.
      await sendEmail({
        to: user.email,
        subject: `Your ${settings.companyName} verification code`,
        html: otpEmail(code, settings.companyName),
      });
      return {
        ...generic,
        data: { channel: "EMAIL", destination: maskEmail(user.email), smsAvailable: false },
      };
    }
    return {
      ...generic,
      data: { channel: "SMS", destination: maskNumber(destination), smsAvailable: true },
    };
  }

  await sendEmail({
    to: user.email,
    subject: `Your ${settings.companyName} verification code`,
    html: otpEmail(code, settings.companyName),
  });

  return {
    ...generic,
    data: {
      channel: "EMAIL",
      destination: maskEmail(user.email),
      smsAvailable: smsConfigured() && Boolean(user.phone),
    },
  };
}

/** Step two — check the code and hand back a short-lived reset token. */
export async function verifyResetCodeAction(payload: {
  identifier: string;
  code: string;
}): Promise<ActionResult> {
  const headerList = await headers();
  const ip = clientIpFrom(headerList) ?? "unknown";

  const limit = rateLimit(`verify:${ip}`, 12, 15 * 60_000);
  if (!limit.success) {
    return { ok: false, message: "Too many attempts. Please request a new code." };
  }

  const code = payload.code?.replace(/\D/g, "");
  if (!code || code.length !== 6) {
    return { ok: false, message: "Enter the six-digit code." };
  }

  const identifier = payload.identifier?.trim() ?? "";
  const digits = identifier.replace(/[^\d]/g, "");
  const user = identifier.includes("@")
    ? await prisma.erpUser.findUnique({ where: { email: identifier.toLowerCase() } })
    : digits.length >= 6
      ? await prisma.erpUser.findFirst({ where: { phone: { contains: digits.slice(-10) } } })
      : null;

  const invalid = { ok: false as const, message: "That code is not correct or has expired." };
  if (!user) return invalid;

  const record = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) return invalid;

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.passwordResetCode.delete({ where: { id: record.id } });
    return { ok: false, message: "Too many incorrect attempts. Request a new code." };
  }

  if (record.codeHash !== hash(code)) {
    await prisma.passwordResetCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      ok: false,
      message:
        left > 0
          ? `That code is not correct. ${left} ${left === 1 ? "attempt" : "attempts"} left.`
          : "Too many incorrect attempts. Request a new code.",
    };
  }

  const resetToken = randomBytes(32).toString("hex");
  await prisma.passwordResetCode.update({
    where: { id: record.id },
    data: {
      consumedAt: new Date(),
      resetToken: hash(resetToken),
      resetExpiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  });

  // The token lives in an httpOnly cookie, so the browser cannot leak it and
  // the final step needs nothing but the new password.
  const cookieStore = await cookies();
  cookieStore.set(RESET_COOKIE, resetToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RESET_TTL_MINUTES * 60,
  });

  return { ok: true, message: "Code verified. Choose a new password." };
}

/** Step three — set the new password and invalidate every existing session. */
export async function completeResetAction(payload: {
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(RESET_COOKIE)?.value;

  if (!token) {
    return { ok: false, message: "This reset has expired. Start again." };
  }
  if (!payload.password || payload.password.length < 8) {
    return {
      ok: false,
      message: "Use at least 8 characters.",
      errors: { password: "At least 8 characters" },
    };
  }
  if (!/[a-zA-Z]/.test(payload.password) || !/[0-9]/.test(payload.password)) {
    return {
      ok: false,
      message: "Include at least one letter and one number.",
      errors: { password: "Needs a letter and a number" },
    };
  }
  if (payload.password !== payload.confirmPassword) {
    return {
      ok: false,
      message: "Those passwords do not match.",
      errors: { confirmPassword: "Passwords do not match" },
    };
  }

  const record = await prisma.passwordResetCode.findUnique({
    where: { resetToken: hash(token) },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!record || !record.resetExpiresAt || record.resetExpiresAt < new Date()) {
    cookieStore.delete(RESET_COOKIE);
    return { ok: false, message: "This reset has expired. Start again." };
  }

  await prisma.erpUser.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(payload.password) },
  });

  // A password change ends every session, everywhere.
  await prisma.erpSession.deleteMany({ where: { userId: record.userId } });
  await prisma.passwordResetCode.deleteMany({ where: { userId: record.userId } });
  await destroyPortalSession();
  cookieStore.delete(RESET_COOKIE);

  const settings = await getSiteSettings();
  await sendEmail({
    to: record.user.email,
    subject: `Your ${settings.companyName} password was changed`,
    html: changedEmail(settings.companyName),
  });

  return { ok: true, message: "Password updated. Sign in with your new password." };
}

// ---------------------------------------------------------------------------
// Email bodies
// ---------------------------------------------------------------------------

function otpEmail(code: string, companyName: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0a0b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111113;border:1px solid #1f1f23;border-radius:16px;">
        <tr><td style="padding:28px 32px;">
          <div style="font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:#3FC8E4;font-weight:600;">${escapeHtml(companyName)}</div>
          <h1 style="margin:14px 0 0;font-size:21px;color:#fafafa;font-weight:600;">Your verification code</h1>
          <p style="margin:14px 0 0;color:#a1a1aa;font-size:15px;line-height:1.6;">Enter this code to reset your password. It expires in ${CODE_TTL_MINUTES} minutes.</p>
          <div style="margin:24px 0;padding:18px;background:#0a0a0b;border:1px solid #1f1f23;border-radius:12px;text-align:center;font-size:34px;letter-spacing:.32em;color:#fafafa;font-weight:600;">${code}</div>
          <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">If you did not ask to reset your password, you can ignore this email — nothing has changed.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function changedEmail(companyName: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0a0b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111113;border:1px solid #1f1f23;border-radius:16px;">
        <tr><td style="padding:28px 32px;">
          <h1 style="margin:0;font-size:20px;color:#fafafa;font-weight:600;">Your password was changed</h1>
          <p style="margin:14px 0 0;color:#a1a1aa;font-size:15px;line-height:1.6;">The password on your ${escapeHtml(companyName)} account has just been updated, and every device has been signed out.</p>
          <p style="margin:14px 0 0;color:#a1a1aa;font-size:15px;line-height:1.6;">If this was not you, reply to this email straight away.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
