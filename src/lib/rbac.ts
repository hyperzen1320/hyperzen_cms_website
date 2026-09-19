/**
 * Capabilities and roles for the CMS.
 *
 * Capabilities are fixed in code — each one gates something real. Roles are
 * data: the global admin, and admins, can create roles such as Developer, HR or
 * Finance and pick exactly which capabilities each one carries.
 *
 * Two rules keep that safe:
 *   • nobody can grant a capability they do not hold themselves, and
 *   • nobody can create, edit or assign a role more senior than their own.
 */

export type Capability =
  | "content.read"
  | "content.write"
  | "content.delete"
  | "content.publish"
  | "media.write"
  | "media.delete"
  | "leads.read"
  | "leads.write"
  | "leads.delete"
  | "marketing.read"
  | "marketing.write"
  | "analytics.read"
  | "notifications.read"
  | "website.write"
  | "settings.write"
  | "roles.manage"
  | "users.manage";

export type CapabilityGroup = "Content" | "Leads & marketing" | "Website" | "Administration";

export const CAPABILITIES: {
  key: Capability;
  label: string;
  description: string;
  group: CapabilityGroup;
}[] = [
  { key: "content.read", label: "View content", description: "Open every content section in the CMS.", group: "Content" },
  { key: "content.write", label: "Create and edit content", description: "Add and change entries, saved as drafts.", group: "Content" },
  { key: "content.publish", label: "Publish content", description: "Decide what visitors can see. Reserve this carefully.", group: "Content" },
  { key: "content.delete", label: "Delete content", description: "Remove entries. A restorable snapshot is always kept.", group: "Content" },
  { key: "media.write", label: "Upload media", description: "Add images, video and documents to the library.", group: "Content" },
  { key: "media.delete", label: "Delete media", description: "Permanently remove files from the library.", group: "Content" },

  { key: "leads.read", label: "View leads", description: "Read enquiries and job applications.", group: "Leads & marketing" },
  { key: "leads.write", label: "Manage leads", description: "Change status, assign an owner and add notes.", group: "Leads & marketing" },
  { key: "leads.delete", label: "Delete leads", description: "Permanently remove an enquiry and its history.", group: "Leads & marketing" },
  { key: "marketing.read", label: "View newsletter", description: "See subscribers and export them.", group: "Leads & marketing" },
  { key: "marketing.write", label: "Manage newsletter", description: "Unsubscribe or remove subscribers.", group: "Leads & marketing" },
  { key: "analytics.read", label: "View analytics", description: "Page views, campaigns and conversion figures.", group: "Leads & marketing" },

  { key: "website.write", label: "Edit website settings", description: "Navigation, footer, SEO and social links.", group: "Website" },
  { key: "notifications.read", label: "View notifications", description: "See the activity feed.", group: "Website" },

  { key: "settings.write", label: "Change settings", description: "Company details, branding, email and maintenance mode.", group: "Administration" },
  { key: "users.manage", label: "Manage staff accounts", description: "Invite, edit and deactivate people who use the CMS.", group: "Administration" },
  { key: "roles.manage", label: "Manage roles", description: "Create roles and decide what each one can do.", group: "Administration" },
];

export const ALL_CAPABILITIES: Capability[] = CAPABILITIES.map((item) => item.key);

/** The key of the one role that always holds everything. */
export const GLOBAL_ADMIN_KEY = "GLOBAL_ADMIN";

/** What `getCurrentUser()` carries so permission checks stay synchronous. */
export type ActorRole = {
  id: string;
  key: string;
  name: string;
  rank: number;
  capabilities: Capability[];
};

export function can(role: ActorRole | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  if (role.key === GLOBAL_ADMIN_KEY) return true;
  return role.capabilities.includes(capability);
}

/** The global admin — the only role that can never be limited. */
export function isGlobalAdmin(role: ActorRole | null | undefined): boolean {
  return role?.key === GLOBAL_ADMIN_KEY;
}

/**
 * Seniority. A lower rank is more senior, and you may only act on roles below
 * your own — so an admin can never edit, assign or delete the global admin.
 */
export function outranks(actor: ActorRole | null | undefined, targetRank: number): boolean {
  if (!actor) return false;
  if (isGlobalAdmin(actor)) return true;
  return actor.rank < targetRank;
}

/** Keep only the capabilities the actor is allowed to hand out. */
export function grantableCapabilities(actor: ActorRole | null | undefined): Capability[] {
  if (!actor) return [];
  if (isGlobalAdmin(actor)) return ALL_CAPABILITIES;
  return ALL_CAPABILITIES.filter((capability) => actor.capabilities.includes(capability));
}

export function normaliseCapabilities(value: unknown): Capability[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(ALL_CAPABILITIES);
  return value
    .map((item) => String(item))
    .filter((item): item is Capability => allowed.has(item));
}

// ---------------------------------------------------------------------------
// The roles every installation starts with
// ---------------------------------------------------------------------------

export type SystemRoleSeed = {
  key: string;
  name: string;
  description: string;
  rank: number;
  capabilities: Capability[];
};

const EDITORIAL: Capability[] = ["content.read", "content.write", "media.write", "notifications.read"];

export const SYSTEM_ROLES: SystemRoleSeed[] = [
  {
    key: GLOBAL_ADMIN_KEY,
    name: "Global admin",
    description:
      "Full access to everything, including settings, roles and publishing. The only role that can never be restricted.",
    rank: 0,
    capabilities: ALL_CAPABILITIES,
  },
  {
    key: "ADMIN",
    name: "Admin",
    description:
      "Runs day-to-day work: all content, leads, media and the website, plus creating roles and assigning them to staff. Cannot change global settings.",
    rank: 10,
    capabilities: [
      ...EDITORIAL,
      "content.delete",
      "content.publish",
      "media.delete",
      "leads.read",
      "leads.write",
      "marketing.read",
      "marketing.write",
      "analytics.read",
      "website.write",
      "users.manage",
      "roles.manage",
    ],
  },
  {
    key: "EDITOR",
    name: "Editor",
    description: "Writes and edits content as drafts. No access to leads, settings or publishing.",
    rank: 40,
    capabilities: [...EDITORIAL, "analytics.read"],
  },
  {
    key: "DIGITAL_MARKETING",
    name: "Digital marketing",
    description: "Content, media, the newsletter and campaign analytics.",
    rank: 40,
    capabilities: [
      ...EDITORIAL,
      "marketing.read",
      "marketing.write",
      "analytics.read",
      "leads.read",
    ],
  },
  {
    key: "HR",
    name: "HR",
    description: "Job openings and the applications that come in against them.",
    rank: 40,
    capabilities: [...EDITORIAL, "leads.read"],
  },
  {
    key: "FINANCE",
    name: "Finance",
    description: "Read-only view of enquiries and performance figures.",
    rank: 40,
    capabilities: ["leads.read", "analytics.read", "notifications.read"],
  },
  {
    key: "DEVELOPER",
    name: "Developer",
    description: "Reads content and analytics to build against. No editing rights by default.",
    rank: 50,
    capabilities: ["content.read", "analytics.read", "notifications.read"],
  },
  {
    key: "TESTING",
    name: "Testing / QA",
    description: "Reviews content and checks published pages. Read-only.",
    rank: 50,
    capabilities: ["content.read", "analytics.read", "notifications.read"],
  },
  {
    key: "INTERN",
    name: "Intern",
    description: "The smallest useful footprint: read content and see notifications.",
    rank: 80,
    capabilities: ["content.read", "notifications.read"],
  },
];
