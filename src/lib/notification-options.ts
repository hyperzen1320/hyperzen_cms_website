import type { NotificationKind } from "@prisma/client";

/**
 * Constants shared by the server recorder and the client UI. Kept out of
 * `lib/notifications.ts` because that module is server-only.
 */
export const RETENTION_OPTIONS = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
  { value: 730, label: "2 years" },
  { value: 0, label: "Keep forever" },
] as const;

export const KIND_LABELS: Record<NotificationKind, string> = {
  LEAD: "Enquiry",
  APPLICATION: "Application",
  SUBSCRIBER: "Subscriber",
  CONTENT: "Content",
  PUBLISH: "Publishing",
  MEDIA: "Media",
  SETTINGS: "Settings",
  ACCOUNT: "Accounts",
  PORTAL: "Portal",
};
