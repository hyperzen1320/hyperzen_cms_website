# Hyperzen Innovation — website + CMS

A production-ready marketing site for **Hyperzen Innovation Pvt Ltd** with a complete custom CMS
built into the same application. Everything on the public site — copy, navigation, services, case
studies, articles, jobs, SEO, branding colours — is edited at `/admin` and appears on the site on
the next request. No rebuild, no external CMS service.

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL
- **CMS:** custom, in-repo, session-authenticated, role-based
- **Deployment target:** Vercel (or any Node host); PostgreSQL via Supabase, Neon, RDS or self-hosted

---

## Table of contents

1. [Quick start](#quick-start)
2. [Project structure](#project-structure)
3. [Environment variables](#environment-variables)
4. [Database setup](#database-setup)
5. [Running locally](#running-locally)
6. [Sign-in portal](#sign-in-portal)
7. [Admin setup](#admin-setup)
8. [Using the CMS](#using-the-cms)
9. [Notifications](#notifications)
10. [Adding content](#adding-content)
11. [Changing branding](#changing-branding)
12. [Email configuration](#email-configuration)
13. [Media storage](#media-storage)
14. [SEO](#seo)
15. [Analytics](#analytics)
16. [Security](#security)
17. [Deployment](#deployment)
18. [Scripts reference](#scripts-reference)
19. [Troubleshooting](#troubleshooting)

---

## Quick start

```bash
npm install
cp .env.example .env          # then set AUTH_SECRET and DATABASE_URL

# Terminal 1 — a local PostgreSQL for development (no Docker needed)
npm run db:dev

# Terminal 2 — create the schema, load content, start the app
npm run db:push
npm run db:seed
npm run dev
```

Open <http://localhost:3000> for the site and <http://localhost:3000/admin> for the CMS.
The seed prints the bootstrap admin credentials — change the password after signing in.

---

## Project structure

```
prisma/
  schema.prisma          Database schema (26 models)
  seed.ts                Seed + demo-content removal script
scripts/
  dev-db.mjs             Embedded PostgreSQL for local development
  create-admin.ts        Create or reset an admin account
src/
  app/
    (site)/              Public website — every route is CMS-driven
    (portal)/            Shared sign-in at /login, plus the ERP workspace at /erp
    admin/               The CMS
      [resource]/        Generic list / create / edit screens
      leads/             CRM
      pages/, homepage/  Page builder
      settings/          General, branding, email, users
    api/                 Public JSON endpoints + admin upload/export
    sitemap.ts, robots.ts
  components/
    ui/                  Primitives (button, accordion, reveal, counter, …)
    sections/            Page-builder blocks + the block renderer
    site/                Header, footer, cards, forms, hero visual
    admin/               CMS shell, tables, forms, editor, charts
  lib/
    admin/               Resource registry, block registry, nav, relations
    auth.ts              CMS sessions, password hashing, origin checks
    portal-auth.ts       ERP customer sessions
    queries.ts           Every public data read
    seo.ts               Metadata + JSON-LD
    email.ts             SMTP transport + templates
    storage.ts           Upload validation + local/database drivers
    rbac.ts              Role → capability matrix
    notifications.ts     Activity log, retention and purge
public/
  uploads/               Local media (git-ignored)
```

**Two registries drive most of the CMS.** `lib/admin/resources.ts` describes each content type
(fields, list columns, permissions, public path) and `lib/admin/blocks.ts` describes each
page-builder block. Adding a field to a service — or a new block to the builder — is a change in
one file, not a new screen.

---

## Environment variables

Copy `.env.example` to `.env`. Nothing here is exposed to the browser except `NEXT_PUBLIC_SITE_URL`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Signing secret. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical URL, used for metadata, sitemap and email links |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | first run | Bootstrap admin account for `db:seed` and `admin:create` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_SECURE` | no | Fallback SMTP. Settings saved in the CMS take precedence |
| `EMAIL_FROM` / `EMAIL_NOTIFICATION` | no | Default sender and notification inbox |
| `MEDIA_STORAGE` | no | `local` (default) or `db` — see [Media storage](#media-storage) |
| `MAX_UPLOAD_MB` | no | Upload size limit, default `8` |

---

## Database setup

The schema targets **PostgreSQL 14+** and works unchanged on Supabase, Neon, RDS and self-hosted
Postgres.

### Production / hosted

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
npm run db:push        # or: npm run db:migrate  to generate a migration
npm run db:seed        # optional: services, industries, navigation, demo content
```

With a connection pooler (Supabase's pooled port, PgBouncer) add `?pgbouncer=true` to
`DATABASE_URL` and use the direct connection string for migrations.

### Local development

`npm run db:dev` starts an embedded PostgreSQL ([PGlite](https://pglite.dev)) that speaks the real
PostgreSQL wire protocol on `127.0.0.1:5433`. No Docker, no install, and the data lives in
`.pgdata/`. It is a **development convenience only** — point `DATABASE_URL` at a real PostgreSQL
server in production.

> The embedded server accepts **one client connection at a time**. Stop `npm run dev` before running
> `db:push`, `db:seed` or `db:studio`, then start it again. A real PostgreSQL has no such limit.

---

## Running locally

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

---

## Sign-in portal

There is one sign-in screen at **/login** for both audiences, with **Sign in** and **Create
account** as two tabs on the same screen. The email decides where you land — nobody has to know
which door they belong to:

| Account | Table | Cookie | Lands on |
| --- | --- | --- | --- |
| **CMS staff** | `AdminUser` | `hz_session` | `/admin` |
| **ERP customer** | `ErpUser` | `hz_portal` | `/erp` |

The two are deliberately separate tables, cookies and sessions: a customer can never end up holding
a staff session, and either side can be revoked without touching the other. A failed attempt never
reveals which of the two an address belongs to.

**Create account** registers an ERP customer only. Staff accounts are created by an administrator
under Settings → Admin users — there is no way to self-register into the CMS.

`/admin/login` still works; the middleware forwards it to `/login`.

The site header carries a single **Sign in** button pointing here. The in-page calls to action (the
closing CTA band, per-service CTAs) still go to the contact form and remain editable in the CMS
under Settings → General, Footer & CTA, and each service.

---

## Admin setup

The seed creates the first account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. To create or reset one
later:

```bash
npm run admin:create -- --email you@company.com --name "Your Name" --password "a-strong-password" --role SUPER_ADMIN
```

Roles:

| Role | Shown as | Can do |
| --- | --- | --- |
| `SUPER_ADMIN` | Global admin | Everything — publishing, page and section visibility, settings, admin users, notification retention, deleting leads |
| `ADMIN` | Admin | All content, media, leads and marketing, but cannot publish, change settings or manage users |
| `EDITOR` | Editor | Create and edit content and media; cannot delete, publish, or see leads |

**Publishing is reserved for the global admin.** Admins and editors save drafts; only a global admin
can move something to `PUBLISHED`, hide a page section, or take a page off the site. The status
control is not merely hidden for other roles — it is removed from the form server-side, and a save
that asks for `PUBLISHED` without the capability is written back as a draft with a message saying
so. Screens that need a capability the account lacks — Settings → Admin users, for example — return
a real 404 rather than an empty page.

Sessions are stored in the database, last seven days, and are invalidated when the account's
password changes.

---

## Using the CMS

Sign in at `/admin`.

| Section | What it controls |
| --- | --- |
| **Dashboard** | Lead totals, 30-day trend, service interest, recent activity |
| **Homepage** | The page builder for `/` |
| **Pages** | Any other block-composed page, including About, Privacy and Terms |
| **Services / Solutions / Industries / Products / Projects / Insights / Careers / FAQs** | Content types, each with its own public detail page |
| **Testimonials** | Client quotes used across the site |
| **Media** | Uploads, alt text, URLs |
| **Leads** | CRM — status pipeline, owner, internal notes, CSV export |
| **Applications** | Job applications with status tracking |
| **Newsletter** | Subscribers and CSV export |
| **Analytics** | First-party page views, CTA clicks, campaigns |
| **Notifications** | Activity log of every change, enquiry and sign-up — see [Notifications](#notifications) |
| **Navigation** | Header menu, mega-menu children, footer columns |
| **Footer & CTA / SEO / Social** | Global site copy and metadata |
| **Settings** | Company details, branding, email, admin users |

### Draft, publish, preview

Every content type has `DRAFT`, `PUBLISHED` and `ARCHIVED`. Only published items appear publicly.
Use **Save draft** while working, **Save & publish** when ready — the publish button and the status
field appear for the global admin only, so everyone else's work lands as a draft for review. The
**View** button on a draft opens the public page with `?preview=1`, which renders unpublished
content **only for signed-in CMS users** — visitors still get a 404.

### Revision history

Saving or deleting content snapshots the previous version. Open any content item and expand
**Revision history** to see who changed what and restore an earlier version.

---

## Notifications

Every change is recorded. The bell in the CMS topbar carries an unread count and a dropdown of the
latest activity; **Notifications** in the sidebar is the full log, filterable by kind and by unread,
with mark-as-read, delete and clear.

What gets recorded, grouped by the switch that governs it:

| Group | Records |
| --- | --- |
| **Enquiries and sign-ups** | Contact enquiries, job applications, newsletter subscriptions, new ERP portal accounts |
| **Content changes** | Every create, edit, delete, publish, unpublish, section show/hide and media upload — including small edits, with a short summary of which fields changed |
| **Settings and accounts** | Branding, SEO, email, navigation and admin-user changes |

### Retention

Notifications are kept for a fixed window and anything older is deleted automatically. The choices
are **30 days**, **90 days** (default), **6 months**, **1 year**, **2 years**, or **Keep forever**.

Cleanup runs opportunistically when the notification centre is opened — at most once an hour — so no
cron job or scheduler is required. Saving a shorter window purges immediately.

### Who can change this

The retention window and the three record-activity switches are **global admin only**; the panel is
not rendered for other roles. Everyone with CMS access can read the log.

Recording is best-effort by design: a notification is never allowed to be the reason a save, an
enquiry or a sign-up fails.

---

## Adding content

**A new service** → Services → *New service*. Fill in the title (the slug fills itself), a short
description, then the detail-page tabs: problem/solution, capability cards, process steps,
technologies, outcomes, use cases and FAQs. Publish. It appears in the services grid, the header
mega menu (if you add the link under Navigation), the sitemap, and at `/services/your-slug` with
`Service` structured data.

**An article** → Insights → *New article*. Write in the rich-text editor (headings, lists, links,
images, quotes, code blocks, tables, alignment). Set a category, tags and a cover image. Reading
time is calculated on save. Published articles appear at `/insights/your-slug` with `Article`
structured data and are searchable.

**A case study** → Projects → *New project*. Add the challenge, what you built, measured results,
the industry, the services involved and an optional testimonial.
*Publish only work the client has approved and figures you can verify.*

**A homepage section** → Homepage → *Add block*. Choose from hero, statistics, text, rich text, two
column, three cards, feature grid, process, image, video, logo cloud, services, solutions,
industries, case studies, products, insights, testimonials, FAQ, CTA and contact form. Each block
has a Design tab for background, spacing, width and alignment, and can be reordered, hidden,
duplicated or removed.

### Demo content

The seed adds placeholder projects, testimonials, products and a job as **drafts** flagged as demo,
so nothing invented is ever publicly visible. Replace them with real content, or remove them:

```bash
npm run db:seed:remove
```

---

## Changing branding

Settings → **Branding**:

- **Logo** — upload one and it replaces the built-in HZ monogram in the header, footer and CMS.
- **Favicon** — a square PNG or SVG.
- **Primary / secondary accent** — hex colours. They drive buttons, gradients, the hero visual and
  the CMS accents, applied as CSS variables at runtime.
- **Announcement bar** — an optional strip above the header.

Settings → **General** covers company name, legal entity, tagline, contact details and the primary
CTA. Footer copy lives under **Footer & CTA**, footer link columns under **Navigation**.

---

## Email configuration

Settings → **Email**. Enter SMTP host, port, username and password, set the from address and the
notification inbox, then **Test connection**.

Email is entirely optional: **every enquiry, application and subscription is written to the database
first**, so nothing is lost when SMTP is not configured. Templates included:

- New lead notification (to your team, reply-to the enquirer)
- Enquiry confirmation (to the enquirer)
- Job application notification
- Newsletter confirmation

Passwords are stored server-side and never sent to the browser; leaving the password field empty
keeps the stored one.

---

## Media storage

| `MEDIA_STORAGE` | Behaviour |
| --- | --- |
| `local` (default) | Writes to `public/uploads`. Good for a VPS or any host with a writable disk |
| `db` | Stores bytes in PostgreSQL and serves them from `/api/media/[id]`. Use on read-only serverless filesystems |

On Vercel the driver defaults to `db` automatically. Uploads are validated by MIME type **and**
magic-number signature, SVGs are stripped of scripts, and the size limit is `MAX_UPLOAD_MB`.

---

## SEO

Handled automatically from published content:

- `sitemap.xml` — every published page, service, solution, industry, product, project, article and job
- `robots.txt` — respects the indexing switch under SEO settings (turn it off on staging)
- JSON-LD — `Organization`, `WebSite`, `Service`, `Article`, `BreadcrumbList`, `FAQPage`, `JobPosting`
- Open Graph and Twitter cards, with per-item overrides
- Canonical URLs, and a per-item **no-index** switch

Global defaults live under **SEO**; every content type can override title, description and social
image.

---

## Analytics

First-party by default: page views, CTA clicks and enquiries are stored in your own database and
shown under **Analytics**. No cookies and no third-party requests.

To add a provider as well, set **Analytics provider** and **Analytics ID** under Settings → General.
Supported: `plausible`, `umami`, `fathom`, `ga`. Anything else adds no script.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- Database-backed sessions in `httpOnly`, `sameSite=lax`, `secure`-in-production cookies
- Edge middleware gates `/admin` and `/erp`; every server action re-checks the session and the role
- Capabilities are enforced server-side, not by hiding buttons: restricted screens 404, restricted
  fields are stripped from the form before it is rendered, and a privileged value submitted anyway
  is rejected or downgraded in the action
- Origin checks on public JSON endpoints; Server Actions carry Next.js's built-in CSRF protection
- Rate limiting on contact, newsletter, applications, search and sign-in
- Zod validation on every public submission; admin writes are validated against the field registry,
  so only declared fields ever reach the database
- Rich text is sanitised on save **and** on render
- Upload validation by signature, with SVG sanitisation
- Prisma's parameterised queries throughout — no string-built SQL
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`) set in `next.config.ts`

---

## Deployment

### Vercel

1. Push the repository and import it in Vercel.
2. Add the environment variables from `.env.example` (`DATABASE_URL`, `AUTH_SECRET`,
   `NEXT_PUBLIC_SITE_URL`, SMTP if used).
3. Deploy. The build runs `prisma generate` automatically.
4. Apply the schema once against the production database:
   ```bash
   DATABASE_URL="postgres://…" npm run db:push
   DATABASE_URL="postgres://…" npm run db:seed
   ```
5. Sign in at `/admin`, change the bootstrap password, and set the real site URL under Settings.

Media defaults to database storage on Vercel because the filesystem is read-only.

### Any Node host

```bash
npm ci
npm run build
npm start          # listens on PORT, default 3000
```

Run it behind a reverse proxy that terminates TLS, and keep `DATABASE_URL` and `AUTH_SECRET` in the
environment rather than in the image.

---

## Scripts reference

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run db:dev` | Embedded PostgreSQL for local development |
| `npm run db:push` | Apply the schema without a migration file |
| `npm run db:migrate` / `npm run db:deploy` | Create and apply migrations |
| `npm run db:seed` | Seed settings, navigation, services, industries, articles, demo content |
| `npm run db:seed:remove` | Delete everything flagged as demo content |
| `npm run db:studio` | Prisma Studio |
| `npm run admin:create` | Create or reset an admin account |

---

## Troubleshooting

**`Could not reach the database`** — the scripts print this with a short checklist instead of a stack
trace. Either `npm run db:dev` is not running, or `npm run dev` is holding the single embedded
connection: stop the app, run the database command, then start it again. Each connection gets
its own handler, so a client that is killed outright — Ctrl+C on the dev server, a crashed script —
releases the database immediately and the embedded server never needs restarting. Anything that
arrives while another client is attached waits its turn for 15 seconds (`DEV_DB_QUEUE_TIMEOUT`)
before giving up.

**`prepared statement "s0" already exists`** — add `?pgbouncer=true` to `DATABASE_URL`. Required for
the embedded dev database and for pooled connections such as Supabase's pooler.

**Admin changes are not visible on the site** — public routes render per request, so a refresh is
enough. Check the item's status is *Published*; drafts are only visible with `?preview=1` while
signed in.

**Email is not sending** — Settings → Email → *Test connection*. Submissions are stored regardless,
so check **Leads** to confirm the form itself is working.

**Uploads fail on a serverless host** — set `MEDIA_STORAGE=db`.

---

© Hyperzen Innovation Pvt Ltd
