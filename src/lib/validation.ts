import { z } from "zod";

/**
 * Validation for everything a visitor or an anonymous client can submit.
 *
 * Admin content forms are validated from their field definitions in
 * `lib/admin/resources.ts` — see `saveResourceAction` — so there is no second
 * copy of the content shapes to keep in step here.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(200)
  .email("Enter a valid email address");

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------

export const SERVICE_OPTIONS = [
  "Web Development",
  "Mobile Development",
  "AI Solutions",
  "AI Automation",
  "SaaS",
  "UI/UX",
  "SEO",
  "Digital Marketing",
  "Custom Software",
  "Other",
] as const;

export const BUDGET_OPTIONS = [
  "Under ₹1L",
  "₹1L – ₹5L",
  "₹5L – ₹15L",
  "₹15L – ₹50L",
  "₹50L+",
  "Not sure yet",
] as const;

export const TIMELINE_OPTIONS = [
  "As soon as possible",
  "1–3 months",
  "3–6 months",
  "6+ months",
  "Still exploring",
] as const;

/**
 * `company_website` is a honeypot. It is accepted by the schema so a browser
 * that autofills it can never show the visitor a confusing error — the route
 * checks it separately and silently discards those submissions.
 */
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  service: z.string().trim().max(80).optional().or(z.literal("")),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  timeline: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(10, "A sentence or two about the project helps").max(5000),
  sourcePage: z.string().trim().max(300).optional().or(z.literal("")),
  referrer: z.string().trim().max(500).optional().or(z.literal("")),
  utmSource: z.string().trim().max(120).optional().or(z.literal("")),
  utmMedium: z.string().trim().max(120).optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(120).optional().or(z.literal("")),
  utmTerm: z.string().trim().max(120).optional().or(z.literal("")),
  utmContent: z.string().trim().max(120).optional().or(z.literal("")),
  company_website: z.string().max(200).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

// ---------------------------------------------------------------------------
// Newsletter, job applications, analytics
// ---------------------------------------------------------------------------

export const newsletterSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  company_website: z.string().max(200).optional(),
});

export const jobApplicationSchema = z.object({
  jobId: z.string().trim().max(60).optional().or(z.literal("")),
  name: z.string().trim().min(2, "Tell us your name").max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  linkedin: z.string().trim().max(300).optional().or(z.literal("")),
  portfolio: z.string().trim().max(300).optional().or(z.literal("")),
  resumeUrl: z.string().trim().max(500).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  company_website: z.string().max(200).optional(),
});

export const analyticsEventSchema = z.object({
  type: z.string().trim().min(1).max(60),
  path: z.string().trim().max(300).optional(),
  label: z.string().trim().max(200).optional(),
  value: z.string().trim().max(200).optional(),
  referrer: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  sessionId: z.string().trim().max(80).optional(),
  device: z.string().trim().max(40).optional(),
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  redirectTo: z.string().max(300).optional(),
});

export const leadNoteSchema = z.object({
  leadId: z.string().min(1),
  body: z.string().trim().min(1, "Write a note").max(4000),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flatten a Zod error into a `{ field: message }` map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Portal (shared CMS + ERP sign-in, ERP self-registration)
// ---------------------------------------------------------------------------

export const portalSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(200),
  next: z.string().max(300).optional(),
});

export const portalSignUpSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(120),
    email: emailSchema,
    company: z.string().trim().max(160).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(200)
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    company_website: z.string().max(200).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
