import type { Capability } from "@/lib/rbac";

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "slug"
  | "number"
  | "switch"
  | "select"
  | "image"
  | "list"
  | "repeater"
  | "date"
  | "color"
  | "icon"
  | "relation"
  | "multirelation"
  | "tags";

/** Options loaded from the database to populate relation pickers. */
export type RelationSource = "services" | "industries" | "testimonials" | "categories";

export type SubField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "icon";
  placeholder?: string;
};

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  source?: RelationSource;
  subfields?: SubField[];
  group?: string;
  width?: "full" | "half";
  rows?: number;
  /** Generate this field's value from another field when it is left empty. */
  slugFrom?: string;
};

export type ListColumn = {
  name: string;
  label: string;
  type?: "text" | "status" | "boolean" | "date" | "number" | "image" | "badge";
  className?: string;
};

export type ResourceConfig = {
  key: string;
  model:
    | "service"
    | "solution"
    | "industry"
    | "product"
    | "project"
    | "testimonial"
    | "blogPost"
    | "category"
    | "job"
    | "fAQ";
  label: string;
  singular: string;
  description: string;
  capability: Capability;
  titleField: string;
  slugField?: string;
  publicPath?: string;
  hasStatus?: boolean;
  hasFeatured?: boolean;
  hasOrder?: boolean;
  searchFields: string[];
  listColumns: ListColumn[];
  groups: string[];
  fields: Field[];
  /** JSON columns that hold arrays of primitives or objects. */
  jsonFields?: string[];
  relations?: { field: string; model: RelationSource; many?: boolean }[];
};

export const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
];

/** Fields every publishable content type shares. */
export function publishingFields(options: { featured?: boolean; order?: boolean } = {}): Field[] {
  return [
    {
      name: "status",
      label: "Status",
      type: "select",
      options: STATUS_OPTIONS,
      group: "Publishing",
      width: "half",
      help: "Only published items appear on the website.",
    },
    ...(options.featured
      ? [
          {
            name: "isFeatured",
            label: "Featured",
            type: "switch" as const,
            group: "Publishing",
            width: "half" as const,
            help: "Featured items are pulled into homepage sections first.",
          },
        ]
      : []),
    ...(options.order
      ? [
          {
            name: "order",
            label: "Sort order",
            type: "number" as const,
            group: "Publishing",
            width: "half" as const,
            help: "Lower numbers appear first.",
          },
        ]
      : []),
  ];
}

/** SEO fields every indexable content type shares. */
export const SEO_FIELDS: Field[] = [
  {
    name: "seoTitle",
    label: "SEO title",
    type: "text",
    group: "SEO",
    help: "Falls back to the title when empty. Aim for under 60 characters.",
  },
  {
    name: "seoDescription",
    label: "Meta description",
    type: "textarea",
    rows: 3,
    group: "SEO",
    help: "Aim for 140–160 characters.",
  },
  { name: "ogImage", label: "Social share image", type: "image", group: "SEO" },
  {
    name: "noIndex",
    label: "Hide from search engines",
    type: "switch",
    group: "SEO",
    help: "Adds noindex to this page only.",
  },
];
