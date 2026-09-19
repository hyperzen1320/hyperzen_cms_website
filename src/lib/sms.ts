import "server-only";

/**
 * SMS delivery.
 *
 * No gateway is wired in by default — sending a text costs money and needs an
 * account, so that is a deliberate choice for whoever deploys this. Set
 * `SMS_PROVIDER=twilio` with the matching credentials and the one-time codes
 * start going out by text; leave it unset and the portal simply offers email.
 */

export type SmsResult = { sent: boolean; skipped?: string; error?: string };

export function smsConfigured(): boolean {
  const provider = process.env.SMS_PROVIDER?.toLowerCase();
  if (provider === "twilio") {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER,
    );
  }
  return false;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER?.toLowerCase();

  if (!smsConfigured()) {
    console.info(`[sms] skipped (no provider configured) → ${maskNumber(to)}`);
    return { sent: false, skipped: "No SMS provider is configured." };
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const token = process.env.TWILIO_AUTH_TOKEN!;
    const from = process.env.TWILIO_FROM_NUMBER!;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: from, Body: body }),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        console.error(`[sms] twilio rejected the message: ${detail.slice(0, 200)}`);
        return { sent: false, error: "The SMS gateway rejected the message." };
      }

      return { sent: true };
    } catch (error) {
      console.error("[sms] send failed:", error);
      return { sent: false, error: "Could not reach the SMS gateway." };
    }
  }

  return { sent: false, skipped: `Unknown SMS provider "${provider}".` };
}

/** "+919876543210" → "+91 ***** 3210" */
export function maskNumber(value: string): string {
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.length < 4) return "•••";
  return `${digits.slice(0, digits.length - 4).replace(/\d/g, "•")}${digits.slice(-4)}`;
}

/** "ada@company.com" → "a••@company.com" */
export function maskEmail(value: string): string {
  const [local = "", domain = ""] = value.split("@");
  if (!domain) return "•••";
  const head = local.slice(0, 1);
  return `${head}${"•".repeat(Math.max(2, local.length - 1))}@${domain}`;
}
