export type NavLink = {
  id: string;
  label: string;
  href: string;
  description?: string | null;
  icon?: string | null;
  badge?: string | null;
  openInNewTab?: boolean;
  children?: NavLink[];
};

export type SocialLink = {
  label: string;
  url: string;
  icon?: string;
};

export type Metric = {
  value: string;
  label: string;
  description?: string;
};

export type FeatureItem = {
  title: string;
  description?: string;
  icon?: string;
};

export type ProcessStep = {
  title: string;
  description?: string;
  step?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ResultItem = {
  value: string;
  label: string;
};

export type PricingTier = {
  name: string;
  price: string;
  description?: string;
  features?: string[];
};

/** Blocks available in the CMS page builder. */
export type BlockType =
  | "HERO"
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "TWO_COLUMN"
  | "THREE_CARDS"
  | "FEATURE_GRID"
  | "STATS"
  | "SERVICES_GRID"
  | "SOLUTIONS_GRID"
  | "INDUSTRY_GRID"
  | "PROJECT_GRID"
  | "PRODUCT_GRID"
  | "TESTIMONIALS"
  | "LOGO_CLOUD"
  | "FAQ"
  | "CTA"
  | "RICH_TEXT"
  | "CONTACT_FORM"
  | "INSIGHTS_GRID"
  | "PROCESS";

export type BlockSettings = {
  background?: "none" | "subtle" | "grid" | "gradient";
  spacing?: "compact" | "normal" | "spacious";
  align?: "left" | "center";
  width?: "default" | "wide" | "narrow";
};

export type ActionResult<T = unknown> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; errors?: Record<string, string> };
