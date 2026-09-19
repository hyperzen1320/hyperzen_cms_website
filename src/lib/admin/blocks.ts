import type { Field } from "@/lib/admin/fields";

export type BlockDefinition = {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: "Layout" | "Content" | "Collections" | "Conversion";
  fields: Field[];
  defaults?: Record<string, unknown>;
};

const CTA_FIELDS: Field[] = [
  { name: "ctaLabel", label: "Button label", type: "text", width: "half" },
  { name: "ctaUrl", label: "Button URL", type: "text", width: "half" },
  { name: "secondaryCtaLabel", label: "Secondary label", type: "text", width: "half" },
  { name: "secondaryCtaUrl", label: "Secondary URL", type: "text", width: "half" },
];

const COLLECTION_FIELDS: Field[] = [
  { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
  { name: "title", label: "Heading", type: "text", width: "half" },
  { name: "description", label: "Description", type: "textarea", rows: 2 },
  { name: "limit", label: "How many to show", type: "number", width: "half" },
  { name: "ctaLabel", label: "Link label", type: "text", width: "half" },
  { name: "ctaUrl", label: "Link URL", type: "text", width: "half" },
];

/** Every block the page builder can place, with the fields it exposes. */
export const BLOCKS: BlockDefinition[] = [
  {
    type: "HERO",
    label: "Hero",
    description: "Full-width opening section with the interactive lattice visual.",
    icon: "Sparkles",
    category: "Layout",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "headline", label: "Headline", type: "text", required: true },
      { name: "highlight", label: "Highlighted words", type: "text", help: "Rendered in the accent gradient after the headline." },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "description", label: "Description", type: "textarea", rows: 3 },
      ...CTA_FIELDS,
      { name: "badges", label: "Badges", type: "list", help: "One per line, shown under the buttons." },
      {
        name: "visual",
        label: "Visual",
        type: "select",
        width: "half",
        options: [
          { label: "System lattice", value: "lattice" },
          { label: "None", value: "none" },
        ],
      },
    ],
    defaults: {
      headline: "Empowering Future",
      highlight: "Enterprises.",
      ctaLabel: "Start a Project",
      ctaUrl: "/contact",
      visual: "lattice",
    },
  },
  {
    type: "STATS",
    label: "Statistics",
    description: "Editable metrics. Hide the section until the numbers are verified.",
    icon: "BarChart3",
    category: "Content",
    fields: [
      { name: "title", label: "Intro line", type: "textarea", rows: 2 },
      {
        name: "items",
        label: "Metrics",
        type: "repeater",
        subfields: [
          { name: "value", label: "Value", placeholder: "120+" },
          { name: "label", label: "Label", placeholder: "Projects delivered" },
          { name: "description", label: "Note", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "TEXT",
    label: "Text",
    description: "Heading and paragraphs.",
    icon: "Type",
    category: "Content",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
      { name: "title", label: "Heading", type: "text", width: "half" },
      { name: "body", label: "Body", type: "textarea", rows: 6, help: "Separate paragraphs with a blank line." },
      {
        name: "align",
        label: "Alignment",
        type: "select",
        width: "half",
        options: [
          { label: "Left", value: "left" },
          { label: "Centre", value: "center" },
        ],
      },
    ],
  },
  {
    type: "RICH_TEXT",
    label: "Rich text",
    description: "Formatted content with headings, lists, links and images.",
    icon: "FileText",
    category: "Content",
    fields: [{ name: "html", label: "Content", type: "richtext" }],
  },
  {
    type: "TWO_COLUMN",
    label: "Two column",
    description: "Narrative beside an image or a set of cards.",
    icon: "Columns2",
    category: "Layout",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
      { name: "title", label: "Heading", type: "text", width: "half" },
      { name: "body", label: "Body", type: "textarea", rows: 6 },
      { name: "bullets", label: "Bullet points", type: "list" },
      { name: "imageUrl", label: "Image", type: "image", width: "half" },
      { name: "imageAlt", label: "Image alt text", type: "text", width: "half" },
      { name: "reverse", label: "Image on the left", type: "switch", width: "half" },
      { name: "ctaLabel", label: "Link label", type: "text", width: "half" },
      { name: "ctaUrl", label: "Link URL", type: "text", width: "half" },
      {
        name: "cards",
        label: "Cards (used when no image is set)",
        type: "repeater",
        subfields: [
          { name: "title", label: "Title" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "icon", label: "Icon", type: "icon" },
        ],
      },
    ],
  },
  {
    type: "THREE_CARDS",
    label: "Three cards",
    description: "Three highlighted cards with icons.",
    icon: "LayoutGrid",
    category: "Content",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
      { name: "title", label: "Heading", type: "text", width: "half" },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      {
        name: "items",
        label: "Cards",
        type: "repeater",
        subfields: [
          { name: "title", label: "Title" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "icon", label: "Icon", type: "icon" },
        ],
      },
    ],
  },
  {
    type: "FEATURE_GRID",
    label: "Feature grid",
    description: "Dense grid of capabilities.",
    icon: "Grid3x3",
    category: "Content",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
      { name: "title", label: "Heading", type: "text", width: "half" },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      {
        name: "items",
        label: "Features",
        type: "repeater",
        subfields: [
          { name: "title", label: "Title" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "icon", label: "Icon", type: "icon" },
        ],
      },
    ],
  },
  {
    type: "PROCESS",
    label: "Process",
    description: "Numbered delivery steps.",
    icon: "Route",
    category: "Content",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
      { name: "title", label: "Heading", type: "text", width: "half" },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      {
        name: "steps",
        label: "Steps",
        type: "repeater",
        subfields: [
          { name: "step", label: "Number", placeholder: "01" },
          { name: "title", label: "Title" },
          { name: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "IMAGE",
    label: "Image",
    description: "Full-width image with an optional caption.",
    icon: "Image",
    category: "Content",
    fields: [
      { name: "url", label: "Image", type: "image" },
      { name: "alt", label: "Alt text", type: "text", width: "half" },
      { name: "caption", label: "Caption", type: "text", width: "half" },
    ],
  },
  {
    type: "VIDEO",
    label: "Video",
    description: "Embedded YouTube/Vimeo video or a hosted file.",
    icon: "Video",
    category: "Content",
    fields: [
      { name: "url", label: "Video URL", type: "text" },
      { name: "poster", label: "Poster image", type: "image", width: "half" },
      { name: "caption", label: "Caption", type: "text", width: "half" },
    ],
  },
  {
    type: "LOGO_CLOUD",
    label: "Logo cloud",
    description: "Row of client or technology logos.",
    icon: "Building2",
    category: "Content",
    fields: [
      { name: "title", label: "Intro line", type: "text" },
      {
        name: "logos",
        label: "Logos",
        type: "repeater",
        subfields: [
          { name: "name", label: "Name" },
          { name: "url", label: "Logo URL" },
        ],
        help: "Leave the URL empty to show the name as text.",
      },
    ],
  },
  {
    type: "SERVICES_GRID",
    label: "Services",
    description: "Pulls published services from the CMS.",
    icon: "Sparkles",
    category: "Collections",
    fields: COLLECTION_FIELDS,
    defaults: { limit: 6, ctaLabel: "All services", ctaUrl: "/services" },
  },
  {
    type: "SOLUTIONS_GRID",
    label: "Solutions",
    description: "Pulls published solutions from the CMS.",
    icon: "Layers",
    category: "Collections",
    fields: COLLECTION_FIELDS,
    defaults: { limit: 6, ctaLabel: "All solutions", ctaUrl: "/solutions" },
  },
  {
    type: "INDUSTRY_GRID",
    label: "Industries",
    description: "Pulls published industries from the CMS.",
    icon: "Building2",
    category: "Collections",
    fields: COLLECTION_FIELDS,
    defaults: { limit: 8 },
  },
  {
    type: "PROJECT_GRID",
    label: "Case studies",
    description: "Featured work, newest first.",
    icon: "FolderKanban",
    category: "Collections",
    fields: COLLECTION_FIELDS,
    defaults: { limit: 3, ctaLabel: "View all work", ctaUrl: "/projects" },
  },
  {
    type: "PRODUCT_GRID",
    label: "Products",
    description: "Published products.",
    icon: "Package",
    category: "Collections",
    fields: COLLECTION_FIELDS,
    defaults: { limit: 3 },
  },
  {
    type: "INSIGHTS_GRID",
    label: "Insights",
    description: "Latest published articles.",
    icon: "Newspaper",
    category: "Collections",
    fields: COLLECTION_FIELDS,
    defaults: { limit: 3, ctaLabel: "All insights", ctaUrl: "/insights" },
  },
  {
    type: "TESTIMONIALS",
    label: "Testimonials",
    description: "Published client quotes.",
    icon: "Quote",
    category: "Collections",
    fields: COLLECTION_FIELDS,
    defaults: { limit: 3 },
  },
  {
    type: "FAQ",
    label: "FAQ",
    description: "Uses the shared FAQ library, or its own inline questions.",
    icon: "MessageCircleQuestion",
    category: "Content",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
      { name: "title", label: "Heading", type: "text", width: "half" },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      { name: "category", label: "FAQ category", type: "text", width: "half", help: "Filters the shared library." },
      { name: "limit", label: "How many to show", type: "number", width: "half" },
      {
        name: "items",
        label: "Inline questions",
        type: "repeater",
        subfields: [
          { name: "question", label: "Question" },
          { name: "answer", label: "Answer", type: "textarea" },
        ],
        help: "If you add questions here they replace the shared library for this block.",
      },
    ],
  },
  {
    type: "CTA",
    label: "Call to action",
    description: "Closing conversion band.",
    icon: "Megaphone",
    category: "Conversion",
    fields: [
      { name: "title", label: "Heading", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", rows: 2 },
      ...CTA_FIELDS,
    ],
    defaults: {
      title: "Let's build something extraordinary.",
      ctaLabel: "Start a Project",
      ctaUrl: "/contact",
    },
  },
  {
    type: "CONTACT_FORM",
    label: "Contact form",
    description: "The multi-step enquiry form.",
    icon: "Mail",
    category: "Conversion",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text", width: "half" },
      { name: "title", label: "Heading", type: "text", width: "half" },
      { name: "description", label: "Description", type: "textarea", rows: 3 },
      { name: "defaultService", label: "Pre-selected service", type: "text", width: "half" },
    ],
  },
];

export const BLOCK_MAP = Object.fromEntries(BLOCKS.map((block) => [block.type, block]));

export function getBlock(type: string): BlockDefinition | null {
  return BLOCK_MAP[type] ?? null;
}

/** Presentation controls shared by every block. */
export const BLOCK_SETTINGS_FIELDS: Field[] = [
  {
    name: "background",
    label: "Background",
    type: "select",
    width: "half",
    options: [
      { label: "None", value: "none" },
      { label: "Subtle", value: "subtle" },
      { label: "Grid", value: "grid" },
      { label: "Gradient glow", value: "gradient" },
    ],
  },
  {
    name: "spacing",
    label: "Spacing",
    type: "select",
    width: "half",
    options: [
      { label: "Compact", value: "compact" },
      { label: "Normal", value: "normal" },
      { label: "Spacious", value: "spacious" },
    ],
  },
  {
    name: "width",
    label: "Content width",
    type: "select",
    width: "half",
    options: [
      { label: "Default", value: "default" },
      { label: "Narrow", value: "narrow" },
      { label: "Wide", value: "wide" },
    ],
  },
  {
    name: "align",
    label: "Alignment",
    type: "select",
    width: "half",
    options: [
      { label: "Left", value: "left" },
      { label: "Centre", value: "center" },
    ],
  },
];
