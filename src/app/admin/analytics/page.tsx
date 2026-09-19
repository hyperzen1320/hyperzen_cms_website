import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { Card, CardTitle, PageHeader, StatCard, Table, Td, Th } from "@/components/admin/ui";
import { SourceChart, ViewsChart } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Analytics" };

type Props = { searchParams: Promise<{ days?: string }> };

export default async function AnalyticsPage({ searchParams }: Props) {
  const user = await requireUser();
  if (!can(user.role, "analytics.read")) notFound();

  const { days } = await searchParams;
  const window = Math.min(90, Math.max(7, Number(days) || 30));

  const since = new Date();
  since.setDate(since.getDate() - (window - 1));
  since.setHours(0, 0, 0, 0);

  const [events, totalViews, ctaClicks, leadEvents, topPages, campaigns, devices] =
    await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { type: "pageview", createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.analyticsEvent.count({ where: { type: "pageview", createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { type: "cta_click", createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { type: "lead", createdAt: { gte: since } } }),
      prisma.analyticsEvent.groupBy({
        by: ["path"],
        where: { type: "pageview", createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["utmSource"],
        where: { createdAt: { gte: since }, utmSource: { not: null } },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["device"],
        where: { type: "pageview", createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);

  const buckets: { label: string; date: string; views: number }[] = [];
  for (let index = 0; index < window; index += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    buckets.push({
      date: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      views: 0,
    });
  }
  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.find((item) => item.date === key);
    if (bucket) bucket.views += 1;
  }

  const sortedPages = [...topPages]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 10);

  const conversion = totalViews ? ((leadEvents / totalViews) * 100).toFixed(1) : "0.0";
  const sourceData = campaigns
    .map((row) => ({ name: row.utmSource ?? "unknown", value: row._count._all }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={`First-party page views and events from the last ${window} days. No cookies, no third-party scripts.`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Page views" value={totalViews} hint={`Last ${window} days`} />
        <StatCard label="CTA clicks" value={ctaClicks} />
        <StatCard label="Enquiries" value={leadEvents} accent />
        <StatCard label="View → enquiry" value={`${conversion}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle title="Page views" description={`Daily totals over the last ${window} days`} />
          <ViewsChart data={buckets} />
        </Card>

        <Card>
          <CardTitle title="Campaign sources" />
          {sourceData.length ? (
            <SourceChart data={sourceData} />
          ) : (
            <div className="grid h-40 place-items-center rounded-lg border border-dashed border-[var(--a-border-strong)]">
              <p className="px-6 text-center text-[13px] text-[var(--a-muted)]">
                No campaign traffic recorded. Add utm_source to your links to see it here.
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle title="Most viewed pages" />
          {sortedPages.length ? (
            <Table>
              <thead>
                <tr>
                  <Th>Path</Th>
                  <Th className="text-right">Views</Th>
                </tr>
              </thead>
              <tbody>
                {sortedPages.map((row) => (
                  <tr key={row.path ?? "unknown"}>
                    <Td className="font-mono text-[12.5px] text-[var(--a-fg)]">
                      {row.path ?? "—"}
                    </Td>
                    <Td className="text-right tabular-nums text-[var(--a-muted)]">
                      {row._count._all}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-[13px] text-[var(--a-muted)]">No page views recorded yet.</p>
          )}
        </Card>

        <Card>
          <CardTitle title="Devices" />
          {devices.length ? (
            <ul className="space-y-2.5">
              {devices
                .sort((a, b) => b._count._all - a._count._all)
                .map((row) => {
                  const share = totalViews ? (row._count._all / totalViews) * 100 : 0;
                  return (
                    <li key={row.device ?? "unknown"}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="capitalize text-[var(--a-fg)]">
                          {row.device ?? "unknown"}
                        </span>
                        <span className="tabular-nums text-[var(--a-muted)]">
                          {row._count._all} · {share.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--a-hover)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${share}%`,
                            background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-[13px] text-[var(--a-muted)]">No device data yet.</p>
          )}

          <p className="mt-5 rounded-lg border border-[var(--a-border)] bg-[var(--a-panel-2)] p-3.5 text-[12.5px] leading-relaxed text-[var(--a-muted)]">
            Analytics are stored in your own database. To add a third-party provider instead, set it
            under Settings → General.
          </p>
        </Card>
      </div>
    </div>
  );
}
