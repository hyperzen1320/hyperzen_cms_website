/**
 * Seed script.
 *
 *   npm run db:seed            populate the database
 *   npm run db:seed:remove     delete everything marked as demo content
 *
 * What gets seeded:
 *  • Site settings, SEO defaults, navigation, footer — real Hyperzen brand data.
 *  • Services, solutions, industries and FAQs — genuine descriptions of the work,
 *    published straight away.
 *  • Projects, testimonials, products and jobs — placeholders flagged `isDemo`
 *    and left as DRAFT so nothing invented is ever publicly visible. Replace the
 *    content in the CMS and publish, or run `npm run db:seed:remove`.
 */
import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertDatabaseReachable } from "../scripts/db-preflight";
import { GLOBAL_ADMIN_KEY, SYSTEM_ROLES } from "../src/lib/rbac";

const prisma = new PrismaClient();

const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      companyName: "Hyperzen",
      legalName: "Hyperzen Innovation Pvt Ltd",
      tagline: "Where ideas meet innovation",
      description:
        "Hyperzen Innovation builds intelligent digital systems, software products and automation solutions that help ambitious businesses move faster.",
      email: "zorahyperzen@gmail.com",
      phone: null,
      address: null,
      addressCountry: "IN",
      socialLinks: [
        { label: "LinkedIn", url: "https://www.linkedin.com/company/hyperzen", icon: "linkedin" },
        { label: "X", url: "https://x.com/hyperzen", icon: "x" },
        { label: "GitHub", url: "https://github.com/hyperzen", icon: "github" },
        { label: "Instagram", url: "https://instagram.com/hyperzen", icon: "instagram" },
      ] satisfies Prisma.InputJsonValue,
      footerDescription:
        "An engineering and innovation company building AI systems, software products and automation for teams that want to move faster.",
      footerCtaTitle: "Let's build something extraordinary.",
      footerCtaText:
        "Tell us what you are trying to build. We will come back with a clear route, an honest timeline and the team to deliver it.",
      footerCtaLabel: "Start a Project",
      footerCtaUrl: "/contact",
      newsletterTitle: "Newsletter",
      newsletterText:
        "Occasional notes on engineering, AI and building digital products. No noise.",
      copyright: `© ${YEAR} Hyperzen Innovation Pvt Ltd. All rights reserved.`,
      primaryCtaLabel: "Start a Project",
      primaryCtaUrl: "/contact",
      accentColor: "#5B8CFF",
      accentColor2: "#8B5CF6",
      announcement: { enabled: false, text: "", url: "" } satisfies Prisma.InputJsonValue,
      analyticsProvider: "internal",
    },
  });

  await prisma.sEOSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteTitle: "Hyperzen Innovation — Empowering Future Enterprises",
      titleTemplate: "%s — Hyperzen Innovation",
      metaDescription:
        "Hyperzen Innovation builds AI solutions, automation, web and mobile applications, SaaS products and custom business systems for ambitious companies.",
      keywords:
        "AI solutions, AI automation, web application development, mobile app development, SaaS development, custom software, cloud solutions, data intelligence, SEO, digital transformation",
      twitterCardType: "summary_large_image",
      robotsIndex: true,
      robotsFollow: true,
    },
  });

  await prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", enabled: false, smtpPort: 587 },
  });
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

async function seedNavigation() {
  if ((await prisma.navigationItem.count()) > 0) return;

  const header: {
    label: string;
    href: string;
    children?: { label: string; href: string; icon: string; description: string }[];
  }[] = [
    { label: "Home", href: "/" },
    {
      label: "Services",
      href: "/services",
      children: [
        { label: "AI Solutions", href: "/services/ai-solutions", icon: "Brain", description: "Models and intelligence wired into real workflows." },
        { label: "AI Automation", href: "/services/ai-automation", icon: "Workflow", description: "Turn repetitive processes into reliable automated flows." },
        { label: "Web Applications", href: "/services/web-application-development", icon: "AppWindow", description: "Fast, accessible products built to scale." },
        { label: "Mobile Applications", href: "/services/mobile-app-development", icon: "Smartphone", description: "Native-quality apps for iOS and Android." },
        { label: "SaaS Products", href: "/services/saas-development", icon: "Boxes", description: "Multi-tenant platforms from zero to launch." },
        { label: "Custom Software", href: "/services/custom-software", icon: "Code2", description: "Systems shaped around how your business runs." },
        { label: "UI/UX Design", href: "/services/ui-ux-design", icon: "PenTool", description: "Interfaces that make complex products feel obvious." },
        { label: "Cloud Solutions", href: "/services/cloud-solutions", icon: "Cloud", description: "Infrastructure that stays fast and predictable." },
        { label: "Data Intelligence", href: "/services/data-intelligence", icon: "ChartNoAxesCombined", description: "Pipelines, warehouses and decision dashboards." },
        { label: "SEO & AI Visibility", href: "/services/seo-ai-visibility", icon: "Radar", description: "Be found by search engines and AI assistants." },
      ],
    },
    {
      label: "Solutions",
      href: "/solutions",
      children: [
        { label: "Business Automation", href: "/solutions/business-automation", icon: "Cog", description: "Remove manual steps across operations." },
        { label: "Digital Transformation", href: "/solutions/digital-transformation", icon: "Rocket", description: "Modernise systems without stopping the business." },
        { label: "ERP Systems", href: "/solutions/erp-systems", icon: "Layers", description: "One operating picture across departments." },
        { label: "CRM Systems", href: "/solutions/crm-systems", icon: "Handshake", description: "Pipeline, customers and revenue in one place." },
        { label: "Customer Portals", href: "/solutions/customer-portals", icon: "Users", description: "Self-service experiences your customers trust." },
        { label: "AI Assistants", href: "/solutions/ai-assistants", icon: "Bot", description: "Assistants grounded in your own knowledge." },
      ],
    },
    { label: "Industries", href: "/industries" },
    { label: "Products", href: "/products" },
    { label: "Work", href: "/projects" },
    { label: "Insights", href: "/insights" },
    { label: "About", href: "/about" },
  ];

  for (const [index, item] of header.entries()) {
    const parent = await prisma.navigationItem.create({
      data: { label: item.label, href: item.href, location: "HEADER", order: index },
    });
    if (item.children) {
      await prisma.navigationItem.createMany({
        data: item.children.map((child, childIndex) => ({
          label: child.label,
          href: child.href,
          icon: child.icon,
          description: child.description,
          location: "HEADER" as const,
          parentId: parent.id,
          order: childIndex,
        })),
      });
    }
  }

  const footer: { location: "FOOTER_SERVICES" | "FOOTER_COMPANY" | "FOOTER_RESOURCES" | "FOOTER_LEGAL"; links: { label: string; href: string }[] }[] = [
    {
      location: "FOOTER_SERVICES",
      links: [
        { label: "AI Solutions", href: "/services/ai-solutions" },
        { label: "AI Automation", href: "/services/ai-automation" },
        { label: "Web Applications", href: "/services/web-application-development" },
        { label: "Mobile Applications", href: "/services/mobile-app-development" },
        { label: "SaaS Products", href: "/services/saas-development" },
        { label: "Cloud Solutions", href: "/services/cloud-solutions" },
      ],
    },
    {
      location: "FOOTER_COMPANY",
      links: [
        { label: "About", href: "/about" },
        { label: "Industries", href: "/industries" },
        { label: "Work", href: "/projects" },
        { label: "Products", href: "/products" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      location: "FOOTER_RESOURCES",
      links: [
        { label: "Insights", href: "/insights" },
        { label: "Solutions", href: "/solutions" },
        { label: "Book a consultation", href: "/book-consultation" },
        { label: "Client portal", href: "/login" },
      ],
    },
    {
      location: "FOOTER_LEGAL",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ];

  for (const group of footer) {
    await prisma.navigationItem.createMany({
      data: group.links.map((link, index) => ({
        label: link.label,
        href: link.href,
        location: group.location,
        order: index,
      })),
    });
  }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

type ServiceSeed = {
  slug: string;
  title: string;
  icon: string;
  tagline: string;
  shortDesc: string;
  heroTitle: string;
  heroSubtitle: string;
  problemTitle: string;
  problemText: string;
  solutionTitle: string;
  solutionText: string;
  features: { title: string; description: string; icon: string }[];
  capabilities: string[];
  process: { step: string; title: string; description: string }[];
  technologies: string[];
  benefits: string[];
  useCases: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
};

const SERVICES: ServiceSeed[] = [
  {
    slug: "ai-solutions",
    title: "AI Solutions",
    icon: "Brain",
    tagline: "Applied intelligence, not experiments",
    shortDesc:
      "Design and ship AI capabilities that sit inside real products and real workflows, with measurable outcomes.",
    heroTitle: "AI that earns its place in your product",
    heroSubtitle:
      "From first use case to production system — model selection, evaluation, guardrails and the engineering around them.",
    problemTitle: "Most AI work stalls at the demo",
    problemText:
      "A prototype impresses in a meeting and then collapses on contact with real data, real permissions and real volume. The gap is rarely the model. It is retrieval quality, evaluation, latency budgets, cost control and the plumbing that connects intelligence to the systems people already use.",
    solutionTitle: "Systems engineered around the model",
    solutionText:
      "We start from the decision the AI is meant to improve, then build backwards: data access, retrieval, prompt and model strategy, evaluation harness, human review paths and observability. The result is a capability your team can trust, measure and keep improving after we hand it over.",
    features: [
      { title: "Use-case discovery", description: "Identify where intelligence changes an outcome, and where conventional software is simply better.", icon: "Target" },
      { title: "Retrieval architecture", description: "Grounded answers from your own documents, databases and systems of record.", icon: "Database" },
      { title: "Evaluation harness", description: "Repeatable scoring so quality is proven before every release, not assumed.", icon: "Gauge" },
      { title: "Guardrails & review", description: "Policy checks, escalation paths and human-in-the-loop where stakes are high.", icon: "ShieldCheck" },
      { title: "Cost & latency control", description: "Caching, routing and model tiering that keep unit economics sane at scale.", icon: "Zap" },
      { title: "Observability", description: "Traces, feedback capture and dashboards that show exactly how the system behaves.", icon: "Activity" },
    ],
    capabilities: [
      "Retrieval-augmented generation over private knowledge",
      "Document understanding and structured extraction",
      "Classification, routing and triage",
      "Conversational assistants with tool access",
      "Forecasting and anomaly detection",
      "Recommendation and ranking systems",
    ],
    process: [
      { step: "01", title: "Frame", description: "Pin down the decision, the data available and how success will be measured." },
      { step: "02", title: "Prototype", description: "A working slice against real data within weeks, not quarters." },
      { step: "03", title: "Evaluate", description: "Build the scoring set, measure quality, cost and latency honestly." },
      { step: "04", title: "Productionise", description: "Harden, integrate, monitor and hand over with documentation and training." },
    ],
    technologies: ["Python", "TypeScript", "PyTorch", "LangChain", "pgvector", "Postgres", "Redis", "Docker", "Kubernetes", "AWS", "Azure"],
    benefits: [
      "Decisions supported by evidence rather than intuition",
      "Hours of manual review compressed into seconds",
      "Quality that can be measured and defended",
      "A platform your own engineers can extend",
    ],
    useCases: [
      { title: "Knowledge assistant", description: "Answer internal questions from policy, product and process documentation with citations." },
      { title: "Document processing", description: "Turn invoices, contracts and forms into structured, validated records." },
      { title: "Support triage", description: "Classify, prioritise and route incoming requests with confidence scores." },
    ],
    faqs: [
      { question: "Do we need our own AI infrastructure?", answer: "Not usually. Most systems run on managed model APIs plus your existing database. Where data residency or cost demands it, we deploy open-weight models on infrastructure you control." },
      { question: "How do you prevent incorrect answers?", answer: "Grounding in your own sources, citation of those sources, confidence thresholds, and human review on high-stakes paths. Each of these is measured by the evaluation harness before release." },
      { question: "Who owns the system afterwards?", answer: "You do — code, prompts, evaluation sets and infrastructure definitions. We hand over documentation and run the training sessions your team needs." },
    ],
  },
  {
    slug: "ai-automation",
    title: "AI Automation",
    icon: "Workflow",
    tagline: "Process work, handled",
    shortDesc:
      "Transform repetitive business processes into intelligent automated workflows that run reliably and report on themselves.",
    heroTitle: "Transform repetitive processes into intelligent workflows",
    heroSubtitle:
      "Map the process, automate the predictable path, escalate the exceptions — with full visibility over both.",
    problemTitle: "The work between the systems",
    problemText:
      "Every growing company accumulates work that lives between its tools: rekeying data, chasing approvals, copying reports, checking one system against another. It is invisible on the org chart, expensive in practice, and it scales linearly with headcount.",
    solutionTitle: "Automate the path, escalate the exception",
    solutionText:
      "We map the process as it actually runs, automate the deterministic majority with conventional engineering, and apply models only where judgement is genuinely needed. Every run is logged, every exception routed to a person with the context to resolve it.",
    features: [
      { title: "Process mapping", description: "Document the real workflow, including the undocumented steps people actually take.", icon: "Route" },
      { title: "System integration", description: "Connect ERP, CRM, spreadsheets, email and internal tools through resilient APIs.", icon: "Plug" },
      { title: "Intelligent routing", description: "Classify and dispatch work based on content, urgency and business rules.", icon: "Waypoints" },
      { title: "Exception handling", description: "Clear escalation paths so edge cases reach a human quickly, with context attached.", icon: "LifeBuoy" },
      { title: "Audit trail", description: "Every action recorded — what ran, what it decided, what changed.", icon: "FileCode2" },
      { title: "Operational dashboards", description: "Volume, throughput, failure rates and time saved, visible to the whole team.", icon: "LayoutDashboard" },
    ],
    capabilities: [
      "Document and invoice processing",
      "Email and ticket triage",
      "Data synchronisation between systems",
      "Approval and escalation workflows",
      "Scheduled reporting and reconciliation",
      "Quality assurance checks",
    ],
    process: [
      { step: "01", title: "Observe", description: "Sit with the team, map the process end to end, and quantify the current cost." },
      { step: "02", title: "Design", description: "Decide what to automate, what to assist and what to leave alone." },
      { step: "03", title: "Build", description: "Implement in small increments, each one live and useful on its own." },
      { step: "04", title: "Operate", description: "Monitor, tune and expand coverage as confidence grows." },
    ],
    technologies: ["Node.js", "Python", "Temporal", "Postgres", "Redis", "REST & GraphQL APIs", "Webhooks", "Docker", "AWS"],
    benefits: [
      "Hours returned to the team every week",
      "Fewer transcription and handover errors",
      "Consistent turnaround times",
      "A written, auditable record of every run",
    ],
    useCases: [
      { title: "Order to invoice", description: "Validate orders, generate invoices and reconcile payments without manual entry." },
      { title: "Onboarding", description: "Collect documents, verify details and provision accounts across systems." },
      { title: "Reporting", description: "Assemble recurring reports from multiple sources and deliver them on schedule." },
    ],
    faqs: [
      { question: "Will this replace people?", answer: "In our experience it removes the work people least want to do and lets the same team handle more volume. We design for augmentation, and we are direct about it when a process is better solved by changing the process itself." },
      { question: "What if a step fails?", answer: "Failures are retried with backoff, then escalated to a named owner with full context. Nothing disappears silently." },
      { question: "Can it work with our legacy systems?", answer: "Usually yes — through APIs where they exist, and through database, file or scripted integration where they do not." },
    ],
  },
  {
    slug: "web-application-development",
    title: "Web Applications",
    icon: "AppWindow",
    tagline: "Fast, accessible, built to last",
    shortDesc:
      "Production web applications engineered for speed, accessibility and maintenance over years, not weeks.",
    heroTitle: "Web applications built to hold up",
    heroSubtitle:
      "Modern architecture, measurable performance and a codebase your team can still move quickly in two years from now.",
    problemTitle: "Speed today, debt tomorrow",
    problemText:
      "Applications are often shipped quickly and then become slow to change. Business logic leaks into components, tests are skipped, performance quietly degrades, and every new feature costs more than the last.",
    solutionTitle: "Architecture that keeps its speed",
    solutionText:
      "Clear boundaries between domain logic, data access and interface. Typed end to end. Automated tests where they earn their keep. Performance budgets enforced in CI. The application stays fast to use and fast to change.",
    features: [
      { title: "Server-first rendering", description: "Fast first paint and strong SEO without shipping unnecessary JavaScript.", icon: "Server" },
      { title: "Design system", description: "A component library that keeps every screen consistent and accessible.", icon: "Layers" },
      { title: "Typed end to end", description: "Types shared from database to interface, so breaking changes surface at build time.", icon: "Code2" },
      { title: "Performance budgets", description: "Core Web Vitals tracked in CI, with regressions blocked before release.", icon: "Gauge" },
      { title: "Accessibility", description: "Keyboard paths, semantics and contrast verified as part of the definition of done.", icon: "Fingerprint" },
      { title: "Observability", description: "Error tracking, logging and analytics wired in from the first deployment.", icon: "Activity" },
    ],
    capabilities: [
      "Customer-facing portals and dashboards",
      "Internal business applications",
      "Marketplaces and booking platforms",
      "Content platforms with custom CMS",
      "Progressive web applications",
      "API design and integration",
    ],
    process: [
      { step: "01", title: "Define", description: "Agree the scope, the architecture and the first shippable milestone." },
      { step: "02", title: "Design", description: "Interface and data model in parallel, reviewed against real content." },
      { step: "03", title: "Build", description: "Two-week increments, deployed continuously to a live environment." },
      { step: "04", title: "Harden", description: "Load, security and accessibility passes before launch, then support." },
    ],
    technologies: ["TypeScript", "React", "Next.js", "Node.js", "Postgres", "Prisma", "Redis", "Tailwind CSS", "Playwright", "Vercel", "AWS"],
    benefits: [
      "Pages that load fast on real devices and networks",
      "A codebase new engineers can read",
      "Fewer regressions through automated checks",
      "Search and accessibility handled properly",
    ],
    useCases: [
      { title: "Customer portal", description: "Give customers self-service access to orders, documents and support." },
      { title: "Operations dashboard", description: "Replace spreadsheets with a live view of the business." },
      { title: "Public platform", description: "Marketing site and product surface with a CMS your team controls." },
    ],
    faqs: [
      { question: "Which stack do you use?", answer: "TypeScript across the stack, React and Next.js on the front, Node.js and PostgreSQL behind it. We deviate when a project genuinely calls for something else, and we explain why." },
      { question: "Can you work with our existing codebase?", answer: "Yes. We start with an audit, agree what to keep, and improve incrementally rather than proposing a rewrite by default." },
      { question: "How do you handle handover?", answer: "Documentation, architecture notes, a runbook and working sessions with your engineers. The goal is that you do not need us." },
    ],
  },
  {
    slug: "mobile-app-development",
    title: "Mobile Applications",
    icon: "Smartphone",
    tagline: "Native quality, sensible economics",
    shortDesc:
      "iOS and Android applications that feel native, work offline and ship through the stores without drama.",
    heroTitle: "Mobile apps people keep on their home screen",
    heroSubtitle:
      "Considered interaction design, offline-first data and release engineering that makes shipping routine.",
    problemTitle: "Mobile is unforgiving",
    problemText:
      "Users judge a mobile app in seconds. Janky scrolling, a spinner on every screen or a broken offline state and the app is deleted. Store review, device fragmentation and OS updates then make every release harder than the last.",
    solutionTitle: "Built for the device, not ported to it",
    solutionText:
      "We design for touch, latency and interruption from the start: optimistic updates, local persistence, background sync and gestures that feel right. Release pipelines are automated so builds, signing and store submission stop being an event.",
    features: [
      { title: "Offline-first data", description: "Local persistence and background sync so the app works on a bad connection.", icon: "Database" },
      { title: "Native feel", description: "Platform conventions, gestures and transitions that match user expectations.", icon: "MonitorSmartphone" },
      { title: "Push & lifecycle", description: "Notifications, deep links and background tasks handled correctly on both platforms.", icon: "Airplay" },
      { title: "Release automation", description: "Signed builds and store submission from CI, with staged rollout.", icon: "Rocket" },
      { title: "Crash analytics", description: "Symbolicated crash reporting and performance traces from day one.", icon: "Activity" },
      { title: "Accessibility", description: "Dynamic type, screen reader labels and contrast that pass platform audits.", icon: "Fingerprint" },
    ],
    capabilities: [
      "Cross-platform apps with React Native",
      "Native modules where performance demands it",
      "Offline-capable field applications",
      "In-app payments and subscriptions",
      "Real-time features and notifications",
      "App store submission and review support",
    ],
    process: [
      { step: "01", title: "Shape", description: "Define the core journeys and the minimum surface worth shipping." },
      { step: "02", title: "Prototype", description: "Interactive build on device early — decisions made on hardware, not mockups." },
      { step: "03", title: "Build", description: "Feature increments with TestFlight and Play internal testing throughout." },
      { step: "04", title: "Launch", description: "Store assets, review submission, staged rollout and post-launch monitoring." },
    ],
    technologies: ["React Native", "TypeScript", "Expo", "Swift", "Kotlin", "SQLite", "Firebase", "Fastlane", "Node.js"],
    benefits: [
      "One codebase across iOS and Android where it makes sense",
      "An app that works away from perfect connectivity",
      "Predictable, repeatable releases",
      "Crash and performance data from the first build",
    ],
    useCases: [
      { title: "Field operations", description: "Data capture for teams working where connectivity is unreliable." },
      { title: "Customer app", description: "Accounts, orders, notifications and support in one place." },
      { title: "Companion app", description: "Extend an existing web platform to mobile without duplicating logic." },
    ],
    faqs: [
      { question: "React Native or fully native?", answer: "React Native for most business applications — one codebase, native performance for typical workloads. Fully native when the product depends on heavy graphics, deep hardware access or platform-specific frameworks." },
      { question: "Do you handle store submission?", answer: "Yes, including store listings, screenshots, review responses and staged rollouts." },
      { question: "What about ongoing OS updates?", answer: "We offer maintenance plans covering OS releases, dependency updates and store policy changes." },
    ],
  },
  {
    slug: "saas-development",
    title: "SaaS Products",
    icon: "Boxes",
    tagline: "From zero to multi-tenant",
    shortDesc:
      "Multi-tenant platforms with billing, roles and operations built in — engineered for the second hundred customers, not just the first.",
    heroTitle: "SaaS platforms engineered past the first release",
    heroSubtitle:
      "Tenancy, billing, permissions, onboarding and operations designed together so growth does not force a rewrite.",
    problemTitle: "The parts nobody demos",
    problemText:
      "The interesting feature is rarely what sinks a SaaS product. It is tenancy bolted on late, permissions that cannot express real organisations, billing that drifts from entitlements, and no way to support a customer without a database console.",
    solutionTitle: "Platform foundations, then features",
    solutionText:
      "We establish tenancy, identity, roles, entitlements, billing and audit as a foundation, then build product on top. Support and operations tooling ship alongside the product rather than being retrofitted after the first difficult customer.",
    features: [
      { title: "Multi-tenancy", description: "Isolation model chosen deliberately, with data boundaries enforced in code.", icon: "Layers" },
      { title: "Roles & permissions", description: "Organisations, teams and granular permissions that mirror real structures.", icon: "Lock" },
      { title: "Billing & entitlements", description: "Plans, seats, usage and limits that stay consistent with what customers can access.", icon: "CreditCard" },
      { title: "Onboarding", description: "Self-service signup, invites and setup flows that reduce time to first value.", icon: "Rocket" },
      { title: "Admin & support tools", description: "Impersonation, audit logs and diagnostics so support does not need engineers.", icon: "LifeBuoy" },
      { title: "Usage analytics", description: "Activation, retention and feature adoption measured from the start.", icon: "LineChart" },
    ],
    capabilities: [
      "B2B platforms with organisation hierarchies",
      "Usage-based and seat-based billing",
      "Single sign-on and SCIM provisioning",
      "Public APIs and webhooks",
      "White-labelling and custom domains",
      "Compliance-ready audit logging",
    ],
    process: [
      { step: "01", title: "Model", description: "Tenancy, identity and pricing model decided before the first feature." },
      { step: "02", title: "Foundation", description: "Auth, roles, billing and admin tooling built as the platform base." },
      { step: "03", title: "Product", description: "Feature development on solid foundations, released continuously." },
      { step: "04", title: "Scale", description: "Performance, cost and reliability work as customer count grows." },
    ],
    technologies: ["TypeScript", "Next.js", "Node.js", "Postgres", "Prisma", "Redis", "Stripe", "Docker", "Kubernetes", "AWS", "Terraform"],
    benefits: [
      "Support handled without engineering escalation",
      "Billing that matches entitlements automatically",
      "Enterprise requirements answerable without a rewrite",
      "Product decisions informed by real usage data",
    ],
    useCases: [
      { title: "Vertical SaaS", description: "A platform purpose-built for one industry's workflow." },
      { title: "Internal tool to product", description: "Turn a system that works internally into a commercial offering." },
      { title: "Platform modernisation", description: "Move a legacy hosted application to a modern multi-tenant architecture." },
    ],
    faqs: [
      { question: "Shared or isolated databases per tenant?", answer: "Shared schema with enforced row-level boundaries suits most products. Isolated databases when compliance, data residency or very large tenants require it — decided early, because changing later is expensive." },
      { question: "Which billing provider?", answer: "Stripe by default. We integrate whatever your finance team already operates, and keep entitlements as the single source of truth in your own database." },
      { question: "Can you take over an existing product?", answer: "Yes. We begin with an architecture and security review, then agree a sequence that delivers value while reducing risk." },
    ],
  },
  {
    slug: "custom-software",
    title: "Custom Software",
    icon: "Code2",
    tagline: "Software shaped around your business",
    shortDesc:
      "Bespoke systems for businesses whose processes do not fit off-the-shelf products — and should not be forced to.",
    heroTitle: "Systems built around how your business actually runs",
    heroSubtitle:
      "When the process is the advantage, the software should follow it — not the other way round.",
    problemTitle: "Configured into a corner",
    problemText:
      "Generic platforms are configured, extended and worked around until the workarounds are the system. Staff maintain shadow spreadsheets, integrations break silently, and the thing that made the business distinctive is buried under compromise.",
    solutionTitle: "Model the domain properly",
    solutionText:
      "We spend real time with the people doing the work, model the domain in their language, and build a system that fits it. Integration with existing tools is designed in, so the new system strengthens the estate rather than adding another island.",
    features: [
      { title: "Domain modelling", description: "Software that uses your vocabulary and enforces your actual rules.", icon: "Compass" },
      { title: "Integration layer", description: "Reliable connections to accounting, logistics, CRM and industry systems.", icon: "Plug" },
      { title: "Role-based access", description: "Permissions that reflect how responsibility is really distributed.", icon: "Lock" },
      { title: "Reporting", description: "Operational and management reporting derived from a single source of truth.", icon: "BarChart3" },
      { title: "Migration", description: "Careful movement of historical data, verified before cutover.", icon: "Database" },
      { title: "Documentation", description: "Architecture notes, runbooks and training for the people who inherit it.", icon: "FileCode2" },
    ],
    capabilities: [
      "Operations and workflow management",
      "Inventory, logistics and scheduling",
      "Quoting, pricing and configuration engines",
      "Compliance and audit systems",
      "Partner and supplier portals",
      "Legacy system replacement",
    ],
    process: [
      { step: "01", title: "Discover", description: "Interviews, process observation and a written model everyone agrees on." },
      { step: "02", title: "Architect", description: "Data model, integration map and delivery sequence." },
      { step: "03", title: "Deliver", description: "Working software every two weeks, used by real people early." },
      { step: "04", title: "Transition", description: "Migration, training, hypercare and a clean handover." },
    ],
    technologies: ["TypeScript", "Node.js", "Python", "Postgres", "Prisma", "Redis", "Docker", "Kubernetes", "AWS", "Azure"],
    benefits: [
      "Fewer spreadsheets running critical processes",
      "One version of the truth across departments",
      "Rules enforced by the system, not by memory",
      "A platform that can keep evolving with the business",
    ],
    useCases: [
      { title: "Operations platform", description: "Replace a patchwork of tools with one coherent system." },
      { title: "Compliance system", description: "Track obligations, evidence and approvals with a full audit trail." },
      { title: "Partner portal", description: "Give suppliers and partners controlled access to the data they need." },
    ],
    faqs: [
      { question: "Is custom software worth it versus off-the-shelf?", answer: "Not always, and we will say so. It is worth it when the process is a competitive advantage, when licence and workaround costs already exceed build cost, or when no product fits without distorting the business." },
      { question: "How do you keep scope under control?", answer: "Fixed-length increments, a prioritised backlog and a working system in front of users from early on. Scope changes are visible trade-offs, not surprises." },
      { question: "What happens to our old system?", answer: "We migrate the data you need, keep the old system readable during transition, and decommission it once the new one has proven itself." },
    ],
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    icon: "PenTool",
    tagline: "Clarity under complexity",
    shortDesc:
      "Product design that makes dense, complicated software feel obvious — grounded in research and shipped as a real design system.",
    heroTitle: "Interfaces that make complex products feel obvious",
    heroSubtitle:
      "Research, interaction design and a coded design system that engineering can actually build with.",
    problemTitle: "Beautiful, but unusable",
    problemText:
      "Design that stops at static screens leaves the hardest questions unanswered: empty states, errors, long content, slow networks, permissions. Engineering then invents the answers under time pressure, and consistency disappears.",
    solutionTitle: "Design the whole system, not the happy path",
    solutionText:
      "We design states, not just screens — loading, empty, error, dense and permission-limited — and deliver a coded component library with the tokens and documentation engineering needs. What ships matches what was designed.",
    features: [
      { title: "Research", description: "Interviews and usability testing with the people who will actually use it.", icon: "Search" },
      { title: "Information architecture", description: "Structure and navigation that match how users think about the work.", icon: "Network" },
      { title: "Interaction design", description: "Flows, states and micro-interactions specified in detail.", icon: "PenTool" },
      { title: "Design system", description: "Tokens and components delivered in code, not only in Figma.", icon: "Layers" },
      { title: "Accessibility", description: "Contrast, focus order and screen reader behaviour designed deliberately.", icon: "Fingerprint" },
      { title: "Design QA", description: "We review the built product against the design and close the gaps.", icon: "Check" },
    ],
    capabilities: [
      "Product discovery and journey mapping",
      "Complex dashboard and data design",
      "Design systems and component libraries",
      "Usability testing",
      "Brand and visual identity for digital products",
      "Prototyping for validation",
    ],
    process: [
      { step: "01", title: "Understand", description: "Users, tasks, constraints and the current experience." },
      { step: "02", title: "Structure", description: "Architecture, flows and low-fidelity validation." },
      { step: "03", title: "Design", description: "Visual design, states and a documented system." },
      { step: "04", title: "Support", description: "Work alongside engineering through build and review." },
    ],
    technologies: ["Figma", "Storybook", "React", "Tailwind CSS", "Framer Motion", "Design tokens", "WCAG 2.2"],
    benefits: [
      "Shorter time to competence for new users",
      "Fewer support requests caused by confusion",
      "A shared visual language across every screen",
      "Accessibility handled as standard",
    ],
    useCases: [
      { title: "Dashboard redesign", description: "Make dense operational data readable and actionable." },
      { title: "Design system", description: "Establish one component library across multiple products." },
      { title: "Onboarding", description: "Reduce drop-off between signup and first meaningful action." },
    ],
    faqs: [
      { question: "Can you work with our engineering team?", answer: "Yes — that is our preference. We deliver a coded design system and review implementation as it is built." },
      { question: "Do you do brand identity?", answer: "We handle digital brand expression: type, colour, motion and component language. For full corporate identity work we partner with brand specialists." },
      { question: "How much research is included?", answer: "Enough to de-risk the decisions that matter. Typically five to eight interviews per key role, plus usability testing at two points in the project." },
    ],
  },
  {
    slug: "cloud-solutions",
    title: "Cloud Solutions",
    icon: "Cloud",
    tagline: "Infrastructure you can reason about",
    shortDesc:
      "Cloud architecture, migration and platform engineering that keeps systems fast, observable and predictably priced.",
    heroTitle: "Infrastructure that stays fast and predictable",
    heroSubtitle:
      "Architecture, migration, automation and cost control — defined in code and documented for your team.",
    problemTitle: "Cloud bills without cloud benefits",
    problemText:
      "Many estates have moved to the cloud without gaining much from it: manually configured resources nobody can reproduce, no clear ownership, oversized instances running idle, and an outage response that depends on one person's memory.",
    solutionTitle: "Everything defined, measured and reproducible",
    solutionText:
      "Infrastructure as code, environments that can be rebuilt from scratch, deployment pipelines with real rollback, monitoring tied to alerts that matter, and a cost model each team can see. Boring in the best sense.",
    features: [
      { title: "Infrastructure as code", description: "Reproducible environments in Terraform — no console-only changes.", icon: "Terminal" },
      { title: "CI/CD pipelines", description: "Automated build, test and deploy with fast, safe rollback.", icon: "GitBranch" },
      { title: "Observability", description: "Metrics, logs and traces with alerts tuned to real failure modes.", icon: "Radar" },
      { title: "Security baseline", description: "Least-privilege access, secret management and network segmentation.", icon: "ShieldCheck" },
      { title: "Cost engineering", description: "Right-sizing, autoscaling and spend visibility per team and service.", icon: "Banknote" },
      { title: "Resilience", description: "Backups, restore drills and documented recovery objectives.", icon: "LifeBuoy" },
    ],
    capabilities: [
      "Cloud migration and modernisation",
      "Kubernetes and container platforms",
      "Serverless architectures",
      "Database operations and tuning",
      "Disaster recovery planning",
      "DevOps enablement for in-house teams",
    ],
    process: [
      { step: "01", title: "Assess", description: "Current architecture, cost, risks and operational maturity." },
      { step: "02", title: "Plan", description: "Target architecture and a migration sequence with rollback at each step." },
      { step: "03", title: "Implement", description: "Automate, migrate and validate under real load." },
      { step: "04", title: "Enable", description: "Documentation, runbooks and training so your team owns it." },
    ],
    technologies: ["AWS", "Azure", "Google Cloud", "Terraform", "Kubernetes", "Docker", "GitHub Actions", "Prometheus", "Grafana", "Postgres"],
    benefits: [
      "Environments that can be rebuilt on demand",
      "Deployments that are routine rather than risky",
      "Alerts that mean something when they fire",
      "Cloud spend that is understood and controlled",
    ],
    useCases: [
      { title: "Migration", description: "Move from on-premise or a legacy host with minimal downtime." },
      { title: "Platform engineering", description: "Give product teams a paved path to production." },
      { title: "Cost reduction", description: "Find and remove waste without compromising reliability." },
    ],
    faqs: [
      { question: "Which cloud should we use?", answer: "Usually the one your team already knows. We work across AWS, Azure and Google Cloud, and the operating model matters more than the logo." },
      { question: "Do we need Kubernetes?", answer: "Often not. Managed services and containers cover most needs with far less operational burden. We recommend Kubernetes only when scale or workload diversity justifies it." },
      { question: "Can you support us after handover?", answer: "Yes, through retained support or on-call arrangements — or we can help you hire and onboard for the role instead." },
    ],
  },
  {
    slug: "data-intelligence",
    title: "Data Intelligence",
    icon: "ChartNoAxesCombined",
    tagline: "From raw data to decisions",
    shortDesc:
      "Data pipelines, warehouses and decision dashboards that give every team the same trustworthy numbers.",
    heroTitle: "One set of numbers everyone trusts",
    heroSubtitle:
      "Pipelines, modelling and dashboards built so definitions are shared, tested and explainable.",
    problemTitle: "Three answers to the same question",
    problemText:
      "When each team exports its own data, every meeting starts by reconciling figures. Definitions drift, reports are rebuilt by hand each month, and the numbers arrive too late to change anything.",
    solutionTitle: "Modelled once, defined in the open",
    solutionText:
      "Data is ingested reliably, modelled in a warehouse with tested definitions, and served through dashboards that state their assumptions. Metrics have owners and documentation, so agreement replaces reconciliation.",
    features: [
      { title: "Ingestion", description: "Scheduled and streaming pipelines with retries and monitoring.", icon: "Cable" },
      { title: "Warehouse modelling", description: "Layered models with tested, version-controlled definitions.", icon: "Database" },
      { title: "Quality tests", description: "Freshness, uniqueness and referential checks that fail loudly.", icon: "ShieldCheck" },
      { title: "Dashboards", description: "Decision-oriented views rather than walls of charts.", icon: "LayoutDashboard" },
      { title: "Metric catalogue", description: "Every metric documented, owned and traceable to source.", icon: "Compass" },
      { title: "Forecasting", description: "Statistical baselines and anomaly detection where they add value.", icon: "LineChart" },
    ],
    capabilities: [
      "Warehouse design on Postgres, BigQuery or Snowflake",
      "ETL and ELT pipeline engineering",
      "Executive and operational dashboards",
      "Customer and product analytics",
      "Data quality monitoring",
      "Reporting automation",
    ],
    process: [
      { step: "01", title: "Inventory", description: "Sources, definitions in use today and the decisions that need support." },
      { step: "02", title: "Model", description: "Warehouse layers, naming and tests agreed with the business." },
      { step: "03", title: "Deliver", description: "Dashboards built with the teams who will rely on them." },
      { step: "04", title: "Operate", description: "Monitoring, documentation and enablement for self-service." },
    ],
    technologies: ["Postgres", "BigQuery", "Snowflake", "dbt", "Airflow", "Python", "Metabase", "Superset", "Looker Studio"],
    benefits: [
      "Meetings that start from agreed numbers",
      "Manual reporting effort largely removed",
      "Data issues caught before they reach a dashboard",
      "Analysts freed for analysis rather than plumbing",
    ],
    useCases: [
      { title: "Executive reporting", description: "One reliable view of performance across the business." },
      { title: "Product analytics", description: "Understand activation, retention and feature adoption." },
      { title: "Operational monitoring", description: "Track throughput and exceptions as they happen." },
    ],
    faqs: [
      { question: "Do we need a warehouse?", answer: "If reporting spans more than a couple of systems, or history matters, yes. For a single application, well-designed reporting queries are often enough — and we will say so." },
      { question: "Which BI tool?", answer: "Whatever your team will actually open. We work with Metabase, Superset, Looker Studio and Power BI, and keep the modelling layer tool-independent." },
      { question: "How do you handle sensitive data?", answer: "Column-level access control, masking, and a documented boundary for what leaves your environment." },
    ],
  },
  {
    slug: "seo-ai-visibility",
    title: "SEO & AI Visibility",
    icon: "Radar",
    tagline: "Findable by search engines and assistants",
    shortDesc:
      "Technical SEO plus generative engine optimisation, so your business is cited by both search results and AI assistants.",
    heroTitle: "Be found by search engines — and by AI assistants",
    heroSubtitle:
      "Technical foundations, structured data and content architecture that both crawlers and language models can use.",
    problemTitle: "Discovery has changed",
    problemText:
      "A growing share of research now happens inside AI assistants that summarise and cite sources directly. Sites built only for classic ranking signals are increasingly invisible in those answers — and often have the technical issues that hurt both channels.",
    solutionTitle: "One technical foundation, two channels",
    solutionText:
      "Crawlability, performance, structured data and clear entity definitions serve traditional search and generative engines alike. We fix the foundation, structure the content so machines can extract facts confidently, and measure both classic rankings and assistant citations.",
    features: [
      { title: "Technical audit", description: "Crawl, index, performance and structured data issues found and fixed.", icon: "Search" },
      { title: "Structured data", description: "Organisation, Service, Article, FAQ and Breadcrumb schema implemented correctly.", icon: "FileCode2" },
      { title: "Entity clarity", description: "Consistent facts about the business that assistants can quote with confidence.", icon: "Fingerprint" },
      { title: "Content architecture", description: "Topic clusters and internal linking that establish depth.", icon: "Network" },
      { title: "Core Web Vitals", description: "Real-user performance improved, not just lab scores.", icon: "Gauge" },
      { title: "Measurement", description: "Rankings, impressions and assistant citations tracked over time.", icon: "LineChart" },
    ],
    capabilities: [
      "Technical SEO audits and remediation",
      "Generative engine optimisation (GEO)",
      "Schema and structured data implementation",
      "Content strategy and briefs",
      "Local and multi-location SEO",
      "Migration SEO for replatforming",
    ],
    process: [
      { step: "01", title: "Audit", description: "Technical, content and competitive baseline with priorities." },
      { step: "02", title: "Fix", description: "Implement technical corrections and structured data." },
      { step: "03", title: "Build", description: "Content architecture and pages that answer real questions." },
      { step: "04", title: "Measure", description: "Track search and assistant visibility, then iterate." },
    ],
    technologies: ["Next.js", "Schema.org", "Google Search Console", "Bing Webmaster Tools", "Lighthouse", "Screaming Frog", "Looker Studio"],
    benefits: [
      "Technical issues that block indexing removed",
      "Content structured so machines can extract facts",
      "Faster pages for real users",
      "Visibility measured across both channels",
    ],
    useCases: [
      { title: "Replatform migration", description: "Move to a new site without losing hard-earned visibility." },
      { title: "Category authority", description: "Build depth around the topics your buyers research." },
      { title: "AI citation", description: "Become a source assistants reference when answering questions in your field." },
    ],
    faqs: [
      { question: "What is GEO?", answer: "Generative engine optimisation: structuring content and facts so AI assistants can retrieve, trust and cite them. It overlaps heavily with good technical SEO, with more emphasis on explicit facts, structure and source clarity." },
      { question: "How long until results?", answer: "Technical fixes can show within weeks. Content-driven authority typically takes three to six months. We report on leading indicators throughout rather than asking you to wait." },
      { question: "Do you guarantee rankings?", answer: "No — nobody credible does. We commit to the work, the measurement and honest reporting of what moved." },
    ],
  },
];

async function seedServices() {
  for (const [index, service] of SERVICES.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: {
        slug: service.slug,
        title: service.title,
        icon: service.icon,
        tagline: service.tagline,
        shortDesc: service.shortDesc,
        heroTitle: service.heroTitle,
        heroSubtitle: service.heroSubtitle,
        problemTitle: service.problemTitle,
        problemText: service.problemText,
        solutionTitle: service.solutionTitle,
        solutionText: service.solutionText,
        features: service.features satisfies Prisma.InputJsonValue,
        capabilities: service.capabilities satisfies Prisma.InputJsonValue,
        process: service.process satisfies Prisma.InputJsonValue,
        technologies: service.technologies satisfies Prisma.InputJsonValue,
        benefits: service.benefits satisfies Prisma.InputJsonValue,
        useCases: service.useCases satisfies Prisma.InputJsonValue,
        faqs: service.faqs satisfies Prisma.InputJsonValue,
        ctaTitle: `Ready to talk about ${service.title.toLowerCase()}?`,
        ctaDescription:
          "Tell us where you are today and what you need to be true in six months. We will map the route.",
        ctaLabel: "Start a Project",
        ctaUrl: "/contact",
        status: "PUBLISHED",
        isFeatured: index < 6,
        order: index,
        publishedAt: new Date(),
        seoTitle: `${service.title} — ${service.tagline}`,
        seoDescription: service.shortDesc,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Solutions
// ---------------------------------------------------------------------------

const SOLUTIONS = [
  {
    slug: "business-automation",
    title: "Business Automation",
    icon: "Cog",
    shortDesc: "Remove the manual steps between your systems and give the time back to your team.",
    overview:
      "Automation programmes that start with the highest-friction processes, prove value quickly, and expand from there. Every automated run is logged and every exception reaches a person with context.",
    outcomes: ["Hours returned each week", "Fewer handover errors", "Consistent turnaround times"],
    capabilities: ["Process mapping", "System integration", "Exception handling", "Operational dashboards"],
    deliverables: ["Process inventory", "Automation platform", "Runbooks", "Team training"],
  },
  {
    slug: "digital-transformation",
    title: "Digital Transformation",
    icon: "Rocket",
    shortDesc: "Modernise systems and ways of working without stopping the business.",
    overview:
      "A sequenced programme that replaces the riskiest legacy dependencies first, delivers working software throughout, and leaves your team able to keep going without us.",
    outcomes: ["Lower operational risk", "Faster delivery cycles", "Systems your team can maintain"],
    capabilities: ["Architecture review", "Migration planning", "Platform engineering", "Change enablement"],
    deliverables: ["Current-state assessment", "Target architecture", "Migration roadmap", "Delivery support"],
  },
  {
    slug: "erp-systems",
    title: "ERP Systems",
    icon: "Layers",
    shortDesc: "One operating picture across finance, inventory, operations and people.",
    overview:
      "Custom and hybrid ERP implementations for businesses whose processes do not fit a standard package — integrated with the accounting and logistics tools you already run.",
    outcomes: ["Single source of truth", "Less duplicate data entry", "Reporting without reconciliation"],
    capabilities: ["Domain modelling", "Module design", "Data migration", "Integration"],
    deliverables: ["Data model", "Core modules", "Migration plan", "Documentation and training"],
  },
  {
    slug: "crm-systems",
    title: "CRM Systems",
    icon: "Handshake",
    shortDesc: "Pipeline, customers and revenue in one place, shaped around how you actually sell.",
    overview:
      "CRM platforms built or extended to match your sales motion, with automation for the administrative work and reporting leadership can rely on.",
    outcomes: ["Cleaner pipeline data", "Less administrative overhead", "Forecasts based on evidence"],
    capabilities: ["Pipeline design", "Automation", "Email and calendar integration", "Reporting"],
    deliverables: ["Configured or custom CRM", "Data migration", "Automation flows", "Adoption support"],
  },
  {
    slug: "customer-portals",
    title: "Customer Portals",
    icon: "Users",
    shortDesc: "Self-service experiences that reduce support load and increase trust.",
    overview:
      "Secure portals where customers can see their orders, documents, tickets and account status — connected directly to your systems of record.",
    outcomes: ["Fewer status enquiries", "Faster resolution", "Higher customer satisfaction"],
    capabilities: ["Identity and access", "Document delivery", "Ticketing integration", "Notifications"],
    deliverables: ["Portal application", "Integrations", "Admin tooling", "Analytics"],
  },
  {
    slug: "internal-platforms",
    title: "Internal Business Platforms",
    icon: "PanelsTopLeft",
    shortDesc: "Replace the spreadsheet estate with tools your team actually wants to use.",
    overview:
      "Internal applications for operations, planning and approvals — designed with the people who use them daily, and fast enough that they stop reaching for the spreadsheet.",
    outcomes: ["Less shadow IT", "Auditable processes", "Faster onboarding of new staff"],
    capabilities: ["Workflow design", "Role-based access", "Bulk operations", "Audit logging"],
    deliverables: ["Internal platform", "Migration from spreadsheets", "Training", "Support plan"],
  },
  {
    slug: "ai-assistants",
    title: "AI Assistants",
    icon: "Bot",
    shortDesc: "Assistants grounded in your own knowledge, with citations and clear boundaries.",
    overview:
      "Internal and customer-facing assistants that answer from your documentation and data, cite their sources, and escalate to a person when confidence is low.",
    outcomes: ["Faster answers to routine questions", "Consistent information", "Lower support burden"],
    capabilities: ["Retrieval architecture", "Evaluation harness", "Guardrails", "Feedback loops"],
    deliverables: ["Assistant application", "Knowledge pipeline", "Evaluation set", "Monitoring"],
  },
  {
    slug: "workflow-automation",
    title: "Workflow Automation",
    icon: "Waypoints",
    shortDesc: "Approvals, handovers and escalations that run themselves and report on progress.",
    overview:
      "Durable workflow engines for multi-step business processes, with visibility into where every item stands and why.",
    outcomes: ["Nothing stuck without an owner", "Measurable cycle times", "Compliant audit trails"],
    capabilities: ["Workflow modelling", "SLA tracking", "Notification design", "Reporting"],
    deliverables: ["Workflow engine", "Process definitions", "Dashboards", "Runbooks"],
  },
  {
    slug: "data-dashboards",
    title: "Data Dashboards",
    icon: "LayoutDashboard",
    shortDesc: "Decision-ready views built on definitions everyone has agreed.",
    overview:
      "Executive and operational dashboards backed by a tested data model, so the numbers are the same wherever they are read.",
    outcomes: ["Agreed metrics", "Less manual reporting", "Faster decisions"],
    capabilities: ["Data modelling", "Dashboard design", "Quality testing", "Self-service enablement"],
    deliverables: ["Warehouse models", "Dashboards", "Metric catalogue", "Training"],
  },
  {
    slug: "enterprise-software",
    title: "Enterprise Software",
    icon: "Building2",
    shortDesc: "Large-scale systems with the security, compliance and integration enterprises require.",
    overview:
      "Enterprise-grade delivery: SSO, granular permissions, audit logging, data residency and integration with the existing estate — designed to pass review, not to work around it.",
    outcomes: ["Security review passed", "Integrated with the estate", "Supportable at scale"],
    capabilities: ["Security architecture", "SSO and provisioning", "Audit and compliance", "Performance engineering"],
    deliverables: ["Architecture documentation", "Platform build", "Compliance evidence", "Operations handover"],
  },
];

async function seedSolutions() {
  for (const [index, solution] of SOLUTIONS.entries()) {
    await prisma.solution.upsert({
      where: { slug: solution.slug },
      update: {},
      create: {
        slug: solution.slug,
        title: solution.title,
        icon: solution.icon,
        shortDesc: solution.shortDesc,
        heroTitle: solution.title,
        overview: solution.overview,
        outcomes: solution.outcomes satisfies Prisma.InputJsonValue,
        capabilities: solution.capabilities satisfies Prisma.InputJsonValue,
        deliverables: solution.deliverables satisfies Prisma.InputJsonValue,
        technologies: ["TypeScript", "Node.js", "Postgres", "React", "Docker", "AWS"] satisfies Prisma.InputJsonValue,
        status: "PUBLISHED",
        isFeatured: index < 6,
        order: index,
        publishedAt: new Date(),
        seoTitle: `${solution.title} — Hyperzen Innovation`,
        seoDescription: solution.shortDesc,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------

const INDUSTRIES = [
  {
    slug: "healthcare",
    name: "Healthcare",
    icon: "HeartPulse",
    shortDesc: "Clinical and administrative systems built around privacy, accuracy and auditability.",
    description:
      "Healthcare software carries obligations most sectors do not: strict access control, complete audit trails, and interfaces that stay usable under pressure. We build for those constraints from the start rather than retrofitting them.",
    challenges: ["Fragmented patient and operational records", "Strict privacy and consent requirements", "Manual administrative workload", "Interoperability with existing clinical systems"],
    solutions: ["Role-based clinical and administrative portals", "Document processing and structured extraction", "Appointment and workflow automation", "Reporting with full audit trails"],
    useCases: [{ title: "Practice operations", description: "Scheduling, records and billing in one auditable system." }, { title: "Patient portal", description: "Secure access to appointments, documents and communication." }],
  },
  {
    slug: "education",
    name: "Education",
    icon: "GraduationCap",
    shortDesc: "Learning platforms and institutional systems that hold up during peak demand.",
    description:
      "Education platforms face extreme usage peaks and a very wide range of user confidence. We design for both: resilient at enrolment and results time, and simple enough for occasional users.",
    challenges: ["Enrolment and assessment peaks", "Disconnected academic and administrative systems", "Manual reporting for accreditation", "Wide range of user technical confidence"],
    solutions: ["Learning and assessment platforms", "Student and staff portals", "Automated compliance reporting", "Integration with existing academic systems"],
    useCases: [{ title: "Institution portal", description: "One place for students, faculty and administration." }, { title: "Assessment platform", description: "Deliver and mark assessments at scale." }],
  },
  {
    slug: "finance",
    name: "Finance",
    icon: "Landmark",
    shortDesc: "Systems where correctness, traceability and controls are the product.",
    description:
      "Financial software is judged on accuracy and evidence. We build with strong data modelling, immutable audit logs, reconciliation by design, and controls that survive external review.",
    challenges: ["Reconciliation across systems", "Regulatory reporting overhead", "Manual review bottlenecks", "Security and access control obligations"],
    solutions: ["Reconciliation and exception platforms", "Document and KYC processing", "Reporting automation with audit trails", "Risk scoring and anomaly detection"],
    useCases: [{ title: "Reconciliation platform", description: "Match transactions across sources and surface exceptions." }, { title: "Client portal", description: "Statements, documents and requests in one secure place." }],
  },
  {
    slug: "logistics",
    name: "Logistics",
    icon: "Truck",
    shortDesc: "Visibility and coordination across movement, inventory and partners.",
    description:
      "Logistics runs on timing and exceptions. We build systems that show where things actually are, flag deviations early, and coordinate the people who need to respond.",
    challenges: ["Limited real-time visibility", "Manual coordination with partners", "Exception handling at scale", "Fragmented documentation"],
    solutions: ["Tracking and visibility platforms", "Partner and carrier portals", "Route and schedule optimisation", "Automated documentation"],
    useCases: [{ title: "Fleet operations", description: "Live status, exceptions and performance in one view." }, { title: "Partner portal", description: "Shared visibility with carriers and customers." }],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    icon: "Factory",
    shortDesc: "Production, quality and maintenance systems connected to the floor.",
    description:
      "Manufacturing software must reflect physical reality. We connect production data to planning and quality systems so decisions are based on what is happening, not what was reported yesterday.",
    challenges: ["Disconnected floor and planning systems", "Paper-based quality records", "Unplanned downtime", "Inventory accuracy"],
    solutions: ["Production monitoring dashboards", "Digital quality and inspection records", "Maintenance scheduling", "Inventory and traceability systems"],
    useCases: [{ title: "Production dashboard", description: "Output, downtime and quality in real time." }, { title: "Quality system", description: "Digital inspections with full traceability." }],
  },
  {
    slug: "ecommerce",
    name: "E-Commerce",
    icon: "ShoppingCart",
    shortDesc: "Storefronts and operations engineered for conversion and peak load.",
    description:
      "Commerce is measured in milliseconds and margins. We build fast storefronts, reliable order operations, and the integrations that keep catalogue, stock and fulfilment consistent.",
    challenges: ["Slow pages costing conversion", "Catalogue and stock accuracy", "Manual order operations", "Peak-season reliability"],
    solutions: ["High-performance storefronts", "Order and fulfilment automation", "Catalogue and inventory synchronisation", "Personalisation and recommendations"],
    useCases: [{ title: "Headless storefront", description: "Fast, flexible commerce front end." }, { title: "Operations platform", description: "Orders, returns and fulfilment in one system." }],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    icon: "Building2",
    shortDesc: "Property, tenancy and transaction systems that keep everyone informed.",
    description:
      "Property businesses coordinate many parties around slow, document-heavy transactions. We build systems that track status clearly and remove the chasing.",
    challenges: ["Document-heavy processes", "Fragmented listing and CRM data", "Manual tenant and owner communication", "Reporting across portfolios"],
    solutions: ["Listing and portfolio platforms", "Tenant and owner portals", "Document workflow automation", "Portfolio reporting"],
    useCases: [{ title: "Portfolio platform", description: "Properties, tenancies and finances in one place." }, { title: "Tenant portal", description: "Requests, documents and payments self-served." }],
  },
  {
    slug: "startups",
    name: "Startups",
    icon: "Rocket",
    shortDesc: "Get to a credible product quickly, without building something you must throw away.",
    description:
      "Early-stage products need to move fast and stay changeable. We build the smallest system that can prove the thesis, with architecture that will not have to be discarded at the first sign of traction.",
    challenges: ["Limited runway", "Uncertain requirements", "Need for credibility with early customers", "Small or no in-house engineering team"],
    solutions: ["MVP delivery in weeks", "Architecture that can scale later", "Design systems for a consistent product", "Fractional engineering support"],
    useCases: [{ title: "MVP build", description: "A focused first version in front of real users quickly." }, { title: "Technical partner", description: "Engineering capacity before the first in-house hire." }],
  },
  {
    slug: "enterprises",
    name: "Enterprises",
    icon: "Briefcase",
    shortDesc: "Delivery that satisfies security, compliance and integration review.",
    description:
      "Enterprise delivery succeeds or fails on integration and governance. We plan for security review, data residency and existing standards from the first week rather than the last.",
    challenges: ["Complex approval and security processes", "Deep legacy integration", "Multiple stakeholder groups", "Compliance evidence requirements"],
    solutions: ["Enterprise architecture and integration", "SSO and provisioning", "Audit and compliance tooling", "Phased modernisation programmes"],
    useCases: [{ title: "System modernisation", description: "Replace legacy platforms without disrupting operations." }, { title: "Integration layer", description: "Connect the estate through a maintained API layer." }],
  },
];

async function seedIndustries() {
  for (const [index, industry] of INDUSTRIES.entries()) {
    await prisma.industry.upsert({
      where: { slug: industry.slug },
      update: {},
      create: {
        slug: industry.slug,
        name: industry.name,
        icon: industry.icon,
        shortDesc: industry.shortDesc,
        heroTitle: `Technology for ${industry.name.toLowerCase()}`,
        description: industry.description,
        challenges: industry.challenges satisfies Prisma.InputJsonValue,
        solutions: industry.solutions satisfies Prisma.InputJsonValue,
        useCases: industry.useCases satisfies Prisma.InputJsonValue,
        status: "PUBLISHED",
        isFeatured: index < 8,
        order: index,
        publishedAt: new Date(),
        seoTitle: `${industry.name} technology solutions — Hyperzen Innovation`,
        seoDescription: industry.shortDesc,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

const FAQS = [
  { question: "How do engagements usually start?", answer: "With a short discovery conversation, then a written summary of the problem, the proposed approach, the sequence of work and an honest estimate. Most projects begin with a paid discovery phase when the scope is genuinely open.", category: "Working together" },
  { question: "What does a typical project cost?", answer: "It depends entirely on scope, but we quote in fixed-scope phases rather than open-ended hourly work so the commitment is clear at each stage. We will tell you early if your budget and scope do not meet.", category: "Working together" },
  { question: "How long does delivery take?", answer: "A focused first release is typically six to twelve weeks. Larger platforms run as a sequence of releases, each one usable, rather than one long build with a single delivery date.", category: "Working together" },
  { question: "Who owns the code and the data?", answer: "You do, in full — source code, infrastructure definitions, documentation and data. We hand over repositories and accounts at the end of every engagement.", category: "Working together" },
  { question: "Do you work with existing in-house teams?", answer: "Frequently. We can lead delivery, work alongside your engineers, or provide specific expertise such as architecture, AI or platform engineering.", category: "Working together" },
  { question: "What happens after launch?", answer: "We offer support and maintenance covering dependency updates, monitoring and enhancements — or we can help you hire and onboard the team who will take it on.", category: "Support" },
  { question: "How do you handle confidentiality?", answer: "We sign NDAs before detailed discussions, restrict access to the people working on your project, and keep credentials in managed secret storage. Access is revoked at handover.", category: "Support" },
];

async function seedFaqs() {
  for (const [index, faq] of FAQS.entries()) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (existing) continue;
    await prisma.fAQ.create({
      data: { ...faq, order: index, status: "PUBLISHED", isDemo: true },
    });
  }
}

// ---------------------------------------------------------------------------
// Pages (homepage, about, legal)
// ---------------------------------------------------------------------------

async function seedPages() {
  const existingHome = await prisma.page.findUnique({ where: { slug: "home" } });
  if (!existingHome) {
    const home = await prisma.page.create({
      data: {
        slug: "home",
        title: "Home",
        description: "Hyperzen Innovation homepage",
        status: "PUBLISHED",
        isSystem: true,
        publishedAt: new Date(),
        seoTitle: "Hyperzen Innovation — Empowering Future Enterprises",
        seoDescription:
          "We build intelligent digital systems, software products and automation solutions for ambitious businesses.",
      },
    });

    const sections: {
      blockType: string;
      name: string;
      content: Prisma.InputJsonValue;
      settings?: Prisma.InputJsonValue;
      isVisible?: boolean;
    }[] = [
      {
        blockType: "HERO",
        name: "Hero",
        content: {
          eyebrow: "Where ideas meet innovation",
          headline: "Empowering Future",
          highlight: "Enterprises.",
          description:
            "Hyperzen builds intelligent digital systems, software products and automation solutions that help ambitious businesses move faster.",
          ctaLabel: "Start a Project",
          ctaUrl: "/contact",
          secondaryCtaLabel: "Explore Our Work",
          secondaryCtaUrl: "/projects",
          badges: ["AI & automation", "Product engineering", "Cloud & data", "Design systems"],
          visual: "lattice",
        },
      },
      {
        blockType: "STATS",
        name: "Trust metrics (hidden until verified)",
        isVisible: false,
        content: {
          title: "Replace these with verified numbers before publishing this section.",
          items: [
            { value: "0", label: "Projects delivered" },
            { value: "0", label: "AI solutions shipped" },
            { value: "0", label: "Industries served" },
            { value: "0%", label: "Client satisfaction" },
          ],
        },
      },
      {
        blockType: "TWO_COLUMN",
        name: "About",
        settings: { background: "subtle" },
        content: {
          eyebrow: "About Hyperzen",
          title: "Technology that turns ambitious ideas into real-world impact.",
          body: "Hyperzen Innovation brings software engineering, AI, automation, cloud, data and product design together in one team. That combination is deliberate: most meaningful problems sit across those boundaries, and handing them between separate vendors is where projects lose their way.\n\nWe work in short, visible increments. You see working software early, you keep the code and the infrastructure, and your team leaves the engagement able to carry it forward.",
          ctaLabel: "More about us",
          ctaUrl: "/about",
          cards: [
            { title: "Engineering", description: "Typed, tested systems built to stay fast to change.", icon: "Code2" },
            { title: "Applied AI", description: "Intelligence wired into workflows, measured honestly.", icon: "Brain" },
            { title: "Cloud & data", description: "Reproducible infrastructure and trustworthy numbers.", icon: "Cloud" },
            { title: "Product design", description: "Interfaces that make complex work feel obvious.", icon: "PenTool" },
          ],
        },
      },
      {
        blockType: "SERVICES_GRID",
        name: "Services",
        content: {
          eyebrow: "Services",
          title: "Engineering across the full product surface",
          description:
            "From first prototype to production platform — one team covering strategy, design, engineering and operations.",
          limit: 6,
          ctaLabel: "All services",
          ctaUrl: "/services",
        },
      },
      {
        blockType: "PROCESS",
        name: "How we work",
        settings: { background: "grid" },
        content: {
          eyebrow: "How we work",
          title: "A sequence you can follow",
          description: "No black boxes. Each phase ends with something you can see, use and judge.",
          steps: [
            { step: "01", title: "Understand", description: "Time with your team to map the problem, constraints and what success actually means." },
            { step: "02", title: "Shape", description: "Architecture, design and a delivery sequence with the first useful milestone defined." },
            { step: "03", title: "Build", description: "Short increments deployed continuously, reviewed with you as they land." },
            { step: "04", title: "Operate", description: "Monitoring, documentation, training and a clean handover to your team." },
          ],
        },
      },
      {
        blockType: "INDUSTRY_GRID",
        name: "Industries",
        content: {
          eyebrow: "Industries",
          title: "Context we already understand",
          description: "Sector knowledge shortens discovery and avoids expensive wrong turns.",
          limit: 8,
          ctaLabel: "All industries",
          ctaUrl: "/industries",
        },
      },
      {
        blockType: "PROJECT_GRID",
        name: "Selected work",
        settings: { background: "subtle" },
        content: {
          eyebrow: "Selected work",
          title: "Systems shipped, outcomes measured",
          limit: 3,
          ctaLabel: "View all work",
          ctaUrl: "/projects",
        },
      },
      {
        blockType: "TESTIMONIALS",
        name: "Testimonials",
        content: { eyebrow: "Client voices", title: "What partners say", limit: 3 },
      },
      {
        blockType: "INSIGHTS_GRID",
        name: "Insights",
        content: {
          eyebrow: "Insights",
          title: "Notes from the engineering floor",
          limit: 3,
          ctaLabel: "All insights",
          ctaUrl: "/insights",
        },
      },
      {
        blockType: "FAQ",
        name: "FAQ",
        settings: { background: "subtle" },
        content: {
          eyebrow: "FAQ",
          title: "Questions, answered",
          description: "The things most teams ask before starting a project.",
          limit: 6,
        },
      },
      {
        blockType: "CTA",
        name: "Closing CTA",
        content: {
          title: "Let's build something extraordinary.",
          description:
            "Tell us what you are trying to build. We will come back with a clear route, an honest timeline and the team to deliver it.",
          ctaLabel: "Start a Project",
          ctaUrl: "/contact",
          secondaryCtaLabel: "Book a consultation",
          secondaryCtaUrl: "/book-consultation",
        },
      },
    ];

    await prisma.pageSection.createMany({
      data: sections.map((section, index) => ({
        pageId: home.id,
        blockType: section.blockType,
        name: section.name,
        content: section.content,
        settings: section.settings ?? {},
        order: index,
        isVisible: section.isVisible ?? true,
      })),
    });
  }

  const legalPages = [
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      description: "How Hyperzen Innovation collects, uses and protects personal information.",
      html: `<h2>Overview</h2><p>This policy explains what personal information Hyperzen Innovation Pvt Ltd collects through this website, why we collect it, and the choices available to you. Replace or extend this text in the CMS to match your final legal position.</p>
<h2>Information we collect</h2><ul><li><strong>Enquiry details</strong> — the name, email address, phone number, company and project information you submit through our contact forms.</li><li><strong>Newsletter details</strong> — your email address, if you subscribe.</li><li><strong>Usage data</strong> — pages viewed and referring source, collected first-party for the purpose of improving the site. We do not use third-party advertising trackers.</li></ul>
<h2>How we use it</h2><p>To respond to your enquiry, to provide services you have requested, and to improve this website. We do not sell personal information, and we do not share it with third parties except where necessary to deliver a service you have asked for.</p>
<h2>Retention</h2><p>Enquiry records are retained for as long as needed to serve the relationship, and then removed on request.</p>
<h2>Your rights</h2><p>You can ask us for a copy of the information we hold about you, ask for it to be corrected, or ask for it to be deleted. Contact us using the details on our contact page.</p>
<h2>Contact</h2><p>Questions about this policy can be sent to the address listed on our contact page.</p>`,
    },
    {
      slug: "terms",
      title: "Terms of Service",
      description: "The terms that apply to the use of this website and our services.",
      html: `<h2>Acceptance</h2><p>By using this website you agree to these terms. Replace or extend this text in the CMS to match your final legal position.</p>
<h2>Use of the site</h2><p>You may browse and use this site for lawful purposes. You may not attempt to gain unauthorised access to any part of the site, its systems or its data.</p>
<h2>Intellectual property</h2><p>Content on this site, including text, design and code, is owned by Hyperzen Innovation Pvt Ltd unless stated otherwise. Client work is shown with permission and remains the property of the respective owners.</p>
<h2>Services</h2><p>Project work is governed by a separate written agreement covering scope, fees, timelines, intellectual property and confidentiality. Nothing on this website constitutes an offer or a binding commitment.</p>
<h2>Liability</h2><p>This site is provided as is. To the extent permitted by law, we are not liable for indirect or consequential loss arising from its use.</p>
<h2>Governing law</h2><p>These terms are governed by the laws of India.</p>`,
    },
  ];

  for (const page of legalPages) {
    const existing = await prisma.page.findUnique({ where: { slug: page.slug } });
    if (existing) continue;
    const created = await prisma.page.create({
      data: {
        slug: page.slug,
        title: page.title,
        description: page.description,
        status: "PUBLISHED",
        isSystem: true,
        publishedAt: new Date(),
        seoTitle: page.title,
        seoDescription: page.description,
      },
    });
    await prisma.pageSection.createMany({
      data: [
        {
          pageId: created.id,
          blockType: "TEXT",
          name: "Header",
          content: { eyebrow: "Legal", title: page.title, body: page.description },
          settings: { spacing: "compact" },
          order: 0,
        },
        {
          pageId: created.id,
          blockType: "RICH_TEXT",
          name: "Body",
          content: { html: page.html },
          settings: { spacing: "compact" },
          order: 1,
        },
      ],
    });
  }

  const about = await prisma.page.findUnique({ where: { slug: "about" } });
  if (!about) {
    const created = await prisma.page.create({
      data: {
        slug: "about",
        title: "About",
        description:
          "Hyperzen Innovation combines software engineering, AI, automation, cloud, data and product design to build scalable digital products.",
        status: "PUBLISHED",
        isSystem: true,
        publishedAt: new Date(),
        seoTitle: "About Hyperzen Innovation",
        seoDescription:
          "An engineering and innovation company building AI systems, software products and automation for ambitious businesses.",
      },
    });

    await prisma.pageSection.createMany({
      data: [
        {
          pageId: created.id,
          blockType: "HERO",
          name: "Hero",
          order: 0,
          content: {
            eyebrow: "About Hyperzen",
            headline: "Technology that turns ambitious ideas into",
            highlight: "real-world impact.",
            description:
              "We are an engineering and innovation company. We combine software engineering, AI, automation, cloud, data and product design to build systems that hold up in production.",
            ctaLabel: "Work with us",
            ctaUrl: "/contact",
            secondaryCtaLabel: "See our work",
            secondaryCtaUrl: "/projects",
            visual: "lattice",
          },
        },
        {
          pageId: created.id,
          blockType: "TWO_COLUMN",
          name: "Vision",
          order: 1,
          settings: { background: "subtle" },
          content: {
            eyebrow: "Vision",
            title: "A globally recognised innovation company",
            body: "Our vision is to become a globally recognised innovation company that empowers businesses through advanced technology, artificial intelligence and creative digital transformation.\n\nThat ambition is grounded in something ordinary: doing the work properly. Systems that are documented, tested and handed over cleanly. Estimates that hold. Honest answers when a project should be smaller than the client expected.",
            bullets: [
              "Deliver high-quality, scalable digital products",
              "Simplify business operations using AI and automation",
              "Help brands establish a strong digital presence with innovative, affordable solutions",
            ],
          },
        },
        {
          pageId: created.id,
          blockType: "THREE_CARDS",
          name: "Values",
          order: 2,
          content: {
            eyebrow: "Values",
            title: "How we work",
            items: [
              { title: "Clarity over jargon", description: "We explain trade-offs in plain language, including the ones that are inconvenient for us.", icon: "Compass" },
              { title: "Working software early", description: "You see something real in weeks. Judgement beats speculation.", icon: "Rocket" },
              { title: "Built to be handed over", description: "Documentation, tests and training so your team owns what we build.", icon: "Handshake" },
            ],
          },
        },
        {
          pageId: created.id,
          blockType: "FEATURE_GRID",
          name: "Capabilities",
          order: 3,
          content: {
            eyebrow: "Capabilities",
            title: "One team, the full surface",
            items: [
              { title: "Software engineering", description: "Typed, tested systems across web, mobile and backend.", icon: "Code2" },
              { title: "Artificial intelligence", description: "Retrieval, extraction and assistants with measured quality.", icon: "Brain" },
              { title: "Automation", description: "Process work removed and monitored end to end.", icon: "Workflow" },
              { title: "Cloud", description: "Reproducible infrastructure and predictable spend.", icon: "Cloud" },
              { title: "Data", description: "Pipelines, warehouses and dashboards teams trust.", icon: "Database" },
              { title: "Product design", description: "Research, interaction design and coded design systems.", icon: "PenTool" },
            ],
          },
        },
        {
          pageId: created.id,
          blockType: "CTA",
          name: "CTA",
          order: 4,
          content: {
            title: "Let's build something extraordinary.",
            description: "Tell us what you are trying to build and we will map the shortest credible route to it.",
            ctaLabel: "Start a Project",
            ctaUrl: "/contact",
          },
        },
      ],
    });
  }
}

// ---------------------------------------------------------------------------
// Demo content — DRAFT + isDemo so nothing invented is ever public
// ---------------------------------------------------------------------------

async function seedDemoContent() {
  const [aiService, webService] = await Promise.all([
    prisma.service.findUnique({ where: { slug: "ai-automation" } }),
    prisma.service.findUnique({ where: { slug: "web-application-development" } }),
  ]);
  const healthcare = await prisma.industry.findUnique({ where: { slug: "healthcare" } });

  const projects = [
    {
      slug: "demo-operations-platform",
      title: "[Demo] Operations platform replacing a spreadsheet estate",
      clientName: "Demo client — replace before publishing",
      summary:
        "Placeholder case study. Replace the client, challenge, solution and results with a real engagement before publishing this project.",
      challenge:
        "Describe the situation the client was in: what was breaking, what it was costing, and why the existing approach could not continue.",
      solutionText:
        "Describe what was built, the key architectural decisions, and how delivery was sequenced.",
      results: [
        { value: "—", label: "Add a measured result" },
        { value: "—", label: "Add a measured result" },
      ],
      technologies: ["Next.js", "TypeScript", "Postgres", "Prisma"],
      industryId: healthcare?.id,
      serviceIds: [webService?.id].filter(Boolean) as string[],
    },
    {
      slug: "demo-document-automation",
      title: "[Demo] Document processing automation",
      clientName: "Demo client — replace before publishing",
      summary:
        "Placeholder case study for an automation engagement. Replace every field with real, verifiable detail before publishing.",
      challenge: "Describe the manual process and its cost.",
      solutionText: "Describe the automation approach and the exception handling design.",
      results: [{ value: "—", label: "Add a measured result" }],
      technologies: ["Python", "Node.js", "Postgres", "Docker"],
      serviceIds: [aiService?.id].filter(Boolean) as string[],
    },
  ];

  for (const [index, project] of projects.entries()) {
    const existing = await prisma.project.findUnique({ where: { slug: project.slug } });
    if (existing) continue;
    await prisma.project.create({
      data: {
        slug: project.slug,
        title: project.title,
        clientName: project.clientName,
        summary: project.summary,
        challenge: project.challenge,
        solutionText: project.solutionText,
        results: project.results satisfies Prisma.InputJsonValue,
        technologies: project.technologies satisfies Prisma.InputJsonValue,
        industryId: project.industryId ?? null,
        year: YEAR,
        status: "DRAFT",
        isDemo: true,
        order: index,
        services: project.serviceIds.length
          ? { connect: project.serviceIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  const testimonials = [
    {
      clientName: "[Demo] Client name",
      designation: "Role",
      company: "Company",
      quote:
        "Placeholder testimonial. Replace with a real, attributed quote you have permission to publish, then set the status to Published.",
    },
    {
      clientName: "[Demo] Client name",
      designation: "Role",
      company: "Company",
      quote:
        "Second placeholder testimonial. Testimonials stay unpublished until they reflect genuine client feedback.",
    },
  ];

  for (const [index, testimonial] of testimonials.entries()) {
    const existing = await prisma.testimonial.findFirst({ where: { quote: testimonial.quote } });
    if (existing) continue;
    await prisma.testimonial.create({
      data: { ...testimonial, rating: 5, status: "DRAFT", isDemo: true, order: index },
    });
  }

  const products = [
    {
      slug: "demo-product",
      name: "[Demo] Product name",
      tagline: "One line describing the product",
      description:
        "Placeholder product entry. Replace the name, description, screenshots and links with a real product before publishing.",
      category: "Internal platform",
      productStatus: "IN_DEVELOPMENT" as const,
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        ...product,
        features: [
          { title: "Feature", description: "Describe a capability" },
        ] satisfies Prisma.InputJsonValue,
        technologies: ["TypeScript", "Next.js", "Postgres"] satisfies Prisma.InputJsonValue,
        status: "DRAFT",
        isDemo: true,
      },
    });
  }

  const jobs = [
    {
      slug: "demo-full-stack-engineer",
      title: "[Demo] Full-stack Engineer",
      department: "Engineering",
      location: "Remote",
      workMode: "REMOTE" as const,
      employmentType: "FULL_TIME" as const,
      experience: "2–5 years",
      description:
        "Placeholder job description. Replace the responsibilities, requirements and benefits with a real opening before publishing.",
      responsibilities: ["Describe a responsibility", "Describe a responsibility"],
      requirements: ["Describe a requirement", "Describe a requirement"],
      benefits: ["Describe a benefit"],
    },
  ];

  for (const [index, job] of jobs.entries()) {
    const existing = await prisma.job.findUnique({ where: { slug: job.slug } });
    if (existing) continue;
    await prisma.job.create({
      data: {
        ...job,
        responsibilities: job.responsibilities satisfies Prisma.InputJsonValue,
        requirements: job.requirements satisfies Prisma.InputJsonValue,
        benefits: job.benefits satisfies Prisma.InputJsonValue,
        applyEmail: "zorahyperzen@gmail.com",
        status: "DRAFT",
        isDemo: true,
        order: index,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { slug: "engineering", name: "Engineering", color: "#5B8CFF", description: "How we build software that lasts." },
  { slug: "artificial-intelligence", name: "AI", color: "#8B5CF6", description: "Applied intelligence, evaluated honestly." },
  { slug: "product", name: "Product", color: "#34D399", description: "Design, discovery and shipping." },
  { slug: "company", name: "Company", color: "#FBBF24", description: "News and announcements." },
];

const POSTS = [
  {
    slug: "why-most-ai-projects-stall-at-the-demo",
    title: "Why most AI projects stall at the demo",
    category: "artificial-intelligence",
    excerpt:
      "The gap between an impressive prototype and a production system is rarely the model. It is evaluation, retrieval quality and the engineering around them.",
    content: `<p>Almost every organisation now has an AI prototype that impressed a room. Far fewer have one running in production. The distance between those two states is consistently underestimated, and it is almost never closed by choosing a better model.</p>
<h2>What actually breaks</h2><p>Three things, in our experience.</p>
<p><strong>Retrieval quality.</strong> A demo runs against ten curated documents. Production runs against ten thousand, half of them outdated, some contradicting each other, many restricted to particular roles. Answer quality collapses long before the model is the constraint.</p>
<p><strong>No definition of correct.</strong> Prototypes are judged by whoever is watching. Production needs a scored evaluation set, built from real questions with known good answers, so a change can be shown to be an improvement rather than assumed to be one.</p>
<p><strong>The surrounding system.</strong> Permissions, audit trails, rate limits, cost controls, fallback behaviour when the provider is slow. None of it is interesting to demo, and all of it decides whether the thing survives contact with real users.</p>
<h2>A more reliable sequence</h2><ol><li>Write down the decision the system is meant to improve, and how you will know it did.</li><li>Build the evaluation set before building the feature. Fifty real questions is usually enough to start.</li><li>Fix retrieval before touching prompts. Most quality problems live here.</li><li>Ship to a small group with a feedback path, and watch what they actually ask.</li><li>Only then optimise cost and latency.</li></ol>
<h2>The uncomfortable question</h2><p>Ask early whether the problem needs a model at all. A meaningful share of the work labelled AI is better solved with a query, a rule or a redesigned form — faster, cheaper and easier to defend. Knowing where the boundary sits is most of the skill.</p>`,
  },
  {
    slug: "the-cost-of-a-slow-page",
    title: "The cost of a slow page, measured properly",
    category: "engineering",
    excerpt:
      "Performance is usually discussed as a lab score. What matters is the experience of a real user on a mid-range phone and an ordinary connection.",
    content: `<p>Performance work often stalls because it is framed as a score to raise rather than an experience to fix. The score is a proxy. The experience is the thing.</p>
<h2>Measure what users get</h2><p>Lab tools run on fast hardware and stable networks. Real users are on mid-range phones, congested mobile networks and browsers with a dozen tabs open. Field data — Core Web Vitals from actual sessions — tells you what is happening; lab data tells you why.</p>
<h2>Where the time usually goes</h2><ul><li><strong>JavaScript.</strong> Shipped, parsed and executed before anything is interactive. Most of it is framework and dependency weight, not application code.</li><li><strong>Images.</strong> Correct formats and explicit dimensions eliminate both weight and layout shift.</li><li><strong>Fonts.</strong> A blocking font request delays every word on the page.</li><li><strong>Third-party scripts.</strong> Tag managers and widgets frequently cost more than the entire application.</li></ul>
<h2>A practical order of work</h2><ol><li>Render on the server and ship interactivity only where it is needed.</li><li>Set a JavaScript budget and enforce it in CI, so regressions are blocked rather than discovered.</li><li>Serve modern image formats with correct sizing and dimensions.</li><li>Self-host fonts, preload the critical face, and always define a fallback.</li><li>Audit third-party scripts twice a year and remove what nobody defends.</li></ol>
<p>None of this is novel. It is simply rarely done consistently, and consistency is what separates a fast site from one that was fast at launch.</p>`,
  },
  {
    slug: "choosing-between-custom-software-and-off-the-shelf",
    title: "Choosing between custom software and off-the-shelf",
    category: "product",
    excerpt:
      "A straightforward test for deciding when to buy, when to build, and when the honest answer is to change the process instead.",
    content: `<p>Custom software is expensive to build and expensive to own. It is also, sometimes, the only sensible option. The decision deserves more rigour than it usually gets.</p>
<h2>Buy when</h2><ul><li>The process is standard and gives you no competitive advantage.</li><li>A mature product covers eighty percent of your needs without heavy configuration.</li><li>The remaining twenty percent can be handled by changing how you work.</li></ul>
<h2>Build when</h2><ul><li>The process <em>is</em> the advantage, and forcing it into a product would erode it.</li><li>Licence plus workaround costs already approach the cost of building.</li><li>Integration requirements exceed what any product exposes.</li><li>You need to own the data model because it changes frequently.</li></ul>
<h2>Change the process when</h2><p>This option is skipped far too often. If the requirement exists only because of an accident of history, no software will fix it — you will simply encode the accident and pay to maintain it. Ask why the process is shaped this way before deciding what to build.</p>
<h2>A useful test</h2><p>Write down the three things the system must do that no product on the market does. If you cannot name three, buy. If you can name three and they are genuinely tied to how you compete, building is likely justified — and worth doing properly.</p>`,
  },
];

async function seedInsights() {
  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, order: index },
    });
  }

  for (const [index, post] of POSTS.entries()) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) continue;
    const category = await prisma.category.findUnique({ where: { slug: post.category } });
    const words = post.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: category?.id ?? null,
        authorName: "Hyperzen Innovation",
        readingMinutes: Math.max(1, Math.round(words / 220)),
        status: "PUBLISHED",
        isFeatured: index === 0,
        isDemo: true,
        publishedAt: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000),
        seoTitle: post.title,
        seoDescription: post.excerpt,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Admin bootstrap
// ---------------------------------------------------------------------------

/** The roles every installation starts with, created before any account. */
async function seedRoles() {
  for (const role of SYSTEM_ROLES) {
    await prisma.staffRole.upsert({
      where: { key: role.key },
      update: { capabilities: role.capabilities, isSystem: true, rank: role.rank },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        capabilities: role.capabilities,
        isSystem: true,
        rank: role.rank,
      },
    });
  }
}

async function seedAdmin() {
  if ((await prisma.adminUser.count()) > 0) return;

  const email = (process.env.ADMIN_EMAIL || "admin@hyperzen.in").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe!2026";
  const globalAdmin = await prisma.staffRole.findUnique({ where: { key: GLOBAL_ADMIN_KEY } });

  await prisma.adminUser.create({
    data: {
      email,
      name: process.env.ADMIN_NAME || "Hyperzen Admin",
      passwordHash: await bcrypt.hash(password, 12),
      roleId: globalAdmin?.id,
    },
  });

  console.log(`\n  Admin account created`);
  console.log(`    email    : ${email}`);
  console.log(`    password : ${password}`);
  console.log(`    Change this password after your first sign-in.\n`);
}

// ---------------------------------------------------------------------------
// Remove demo content
// ---------------------------------------------------------------------------

async function removeDemoContent() {
  const results = await Promise.all([
    prisma.project.deleteMany({ where: { isDemo: true } }),
    prisma.testimonial.deleteMany({ where: { isDemo: true } }),
    prisma.product.deleteMany({ where: { isDemo: true } }),
    prisma.job.deleteMany({ where: { isDemo: true } }),
    prisma.blogPost.deleteMany({ where: { isDemo: true } }),
    prisma.fAQ.deleteMany({ where: { isDemo: true } }),
    prisma.lead.deleteMany({ where: { isDemo: true } }),
    prisma.newsletterSubscriber.deleteMany({ where: { isDemo: true } }),
    prisma.media.deleteMany({ where: { isDemo: true } }),
  ]);

  const total = results.reduce((sum, result) => sum + result.count, 0);
  console.log(`Removed ${total} demo records.`);
}

// ---------------------------------------------------------------------------

async function main() {
  if (!(await assertDatabaseReachable(prisma))) {
    process.exitCode = 1;
    return;
  }

  if (process.argv.includes("--remove")) {
    await removeDemoContent();
    return;
  }

  console.log("Seeding Hyperzen database…");
  await seedSettings();
  await seedNavigation();
  await seedServices();
  await seedSolutions();
  await seedIndustries();
  await seedFaqs();
  await seedInsights();
  await seedPages();
  await seedDemoContent();
  await seedRoles();
  await seedAdmin();

  const counts = {
    services: await prisma.service.count(),
    solutions: await prisma.solution.count(),
    industries: await prisma.industry.count(),
    posts: await prisma.blogPost.count(),
    pages: await prisma.page.count(),
    navigation: await prisma.navigationItem.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
