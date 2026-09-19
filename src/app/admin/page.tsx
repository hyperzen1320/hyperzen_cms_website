import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { Card, CardTitle, StatCard, StatusBadge, Table, Td, Th } from "@/components/admin/ui";
import { LeadsChart, ServiceInterestChart, SourceChart } from "@/components/admin/charts";
import { formatDate, relativeTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const user = await requireUser();
  const showLeads = can(user.role, "leads.read");

  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    newLeads,
    wonLeads,
    services,
    projects,
    posts,
    products,
    testimonials,
    jobs,
    subscribers,
    recentLeads,
    leadsByDay,
    leadsByService,
    leadsBySource,
    recentContent,
    pageViews,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.service.count(),
    prisma.project.count(),
    prisma.blogPost.count(),
    prisma.product.count(),
    prisma.testimonial.count(),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.newsletterSubscriber.count({ where: { isSubscribed: true } }),
    showLeads
      ? prisma.lead.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            service: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.lead.groupBy({ by: ["service"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
    prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true, slug: true },
    }),
    prisma.analyticsEvent.count({ where: { type: "pageview", createdAt: { gte: since } } }),
  ]);

  // Bucket the last 30 days of leads for the trend chart.
  const days: { date: string; label: string; leads: number }[] = [];
  for (let index = 0; index < 30; index += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    days.push({
      date: key,
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      leads: 0,
    });
  }
  for (const lead of leadsByDay) {
    const key = lead.createdAt.toISOString().slice(0, 10);
    const bucket = days.find((day) => day.date === key);
    if (bucket) bucket.leads += 1;
  }

  const serviceData = leadsByService
    .filter((row) => row.service)
    .map((row) => ({ name: row.service as string, value: row._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const sourceData = leadsBySource
    .map((row) => ({ name: row.source ?? "direct", value: row._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--a-fg-strong)]">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1.5 text-[13.5px] text-[var(--a-muted)]">
          Everything published here appears on the website immediately.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {showLeads ? (
          <>
            <StatCard label="Total leads" value={totalLeads} href="/admin/leads" />
            <StatCard label="New leads" value={newLeads} href="/admin/leads?status=NEW" accent />
            <StatCard label="Won" value={wonLeads} href="/admin/leads?status=WON" />
            <StatCard
              label="Page views"
              value={pageViews}
              hint="Last 30 days"
              href="/admin/analytics"
            />
          </>
        ) : (
          <>
            <StatCard label="Services" value={services} href="/admin/services" />
            <StatCard label="Projects" value={projects} href="/admin/projects" />
            <StatCard label="Insights" value={posts} href="/admin/insights" />
            <StatCard label="Products" value={products} href="/admin/products" />
          </>
        )}
      </div>

      {showLeads ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Services" value={services} href="/admin/services" />
          <StatCard label="Projects" value={projects} href="/admin/projects" />
          <StatCard label="Insights" value={posts} href="/admin/insights" />
          <StatCard label="Testimonials" value={testimonials} href="/admin/testimonials" />
          <StatCard label="Open roles" value={jobs} href="/admin/careers" />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle
            title="Leads over time"
            description="Enquiries received in the last 30 days"
          />
          <LeadsChart data={days} />
        </Card>

        <Card>
          <CardTitle title="Leads by source" />
          {sourceData.length ? (
            <SourceChart data={sourceData} />
          ) : (
            <EmptyChart message="No leads recorded yet." />
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle
            title="Recent leads"
            action={
              showLeads ? (
                <Link
                  href="/admin/leads"
                  className="inline-flex items-center gap-1 text-[13px] text-[var(--a-muted)] hover:text-[var(--a-fg)]"
                >
                  View all
                  <ArrowUpRight className="size-3.5" />
                </Link>
              ) : null
            }
          />

          {recentLeads.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Service</Th>
                  <Th>Status</Th>
                  <Th>Received</Th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="transition-colors hover:bg-[var(--a-hover)]">
                    <Td>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-[var(--a-fg-strong)] hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <span className="mt-0.5 block text-[12px] text-[var(--a-subtle)]">
                        {truncate(lead.company || lead.email, 32)}
                      </span>
                    </Td>
                    <Td className="text-[var(--a-muted)]">{lead.service ?? "—"}</Td>
                    <Td>
                      <StatusBadge status={lead.status} />
                    </Td>
                    <Td className="text-[var(--a-muted)]">{relativeTime(lead.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--a-border-strong)] px-6 py-10 text-center">
              <Inbox className="mx-auto size-6 text-[var(--a-subtle)]" />
              <p className="mt-3 text-[13.5px] text-[var(--a-muted)]">
                {showLeads
                  ? "No enquiries yet. They will appear here the moment the contact form is used."
                  : "Lead data is only visible to admins."}
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle title="Leads by service" />
          {serviceData.length ? (
            <ServiceInterestChart data={serviceData} />
          ) : (
            <EmptyChart message="No service interest recorded yet." />
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle
            title="Recently updated content"
            action={
              <Link
                href="/admin/insights"
                className="inline-flex items-center gap-1 text-[13px] text-[var(--a-muted)] hover:text-[var(--a-fg)]"
              >
                Insights
                <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          {recentContent.length ? (
            <ul className="divide-y divide-[var(--a-border)]">
              {recentContent.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <Link
                    href={`/admin/insights/${item.id}`}
                    className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--a-fg)] hover:underline"
                  >
                    {item.title}
                  </Link>
                  <StatusBadge status={item.status} />
                  <span className="shrink-0 text-[12px] text-[var(--a-subtle)]">
                    {formatDate(item.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyChart message="No articles yet." />
          )}
        </Card>

        <Card>
          <CardTitle title="Quick actions" />
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Edit homepage", href: "/admin/homepage" },
              { label: "New article", href: "/admin/insights/new" },
              { label: "New case study", href: "/admin/projects/new" },
              { label: "Add a service", href: "/admin/services/new" },
              { label: "Media library", href: "/admin/media" },
              { label: "Site settings", href: "/admin/settings" },
            ].map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="flex items-center justify-between rounded-lg border border-[var(--a-border)] px-3.5 py-2.5 text-[13.5px] text-[var(--a-fg)] transition-colors hover:border-[var(--a-border-strong)] hover:bg-[var(--a-hover)]"
                >
                  {action.label}
                  <ArrowUpRight className="size-3.5 text-[var(--a-subtle)]" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-lg border border-[var(--a-border)] bg-[var(--a-panel-2)] p-4">
            <p className="text-[12.5px] text-[var(--a-muted)]">
              <span className="font-medium text-[var(--a-fg)]">{subscribers}</span> newsletter
              subscribers ·{" "}
              <Link href="/admin/newsletter" className="text-[var(--accent)] hover:underline">
                manage
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-lg border border-dashed border-[var(--a-border-strong)]">
      <p className="px-6 text-center text-[13px] text-[var(--a-muted)]">{message}</p>
    </div>
  );
}
