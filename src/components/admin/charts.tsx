"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Dashboard charts.
 *
 * Every chart here shows a single measure, so identity never depends on colour:
 * one accent hue carries the marks and all text uses the interface ink tokens.
 * Colours are CSS variables, so light and dark themes are handled by the same
 * markup rather than by flipping a palette at runtime.
 */

const AXIS = {
  stroke: "var(--a-border)",
  tick: { fill: "var(--a-subtle)", fontSize: 11 },
} as const;

function TooltipCard({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: { value?: number | string; payload?: Record<string, unknown> }[];
  label?: string | number;
  suffix: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const name = label ?? (payload[0]?.payload?.name as string) ?? "";

  return (
    <div className="rounded-lg border border-[var(--a-border)] bg-[var(--a-elevated)] px-3 py-2 shadow-[var(--a-shadow)]">
      <p className="text-[12px] text-[var(--a-muted)]">{name}</p>
      <p className="mt-0.5 text-[14px] font-medium text-[var(--a-fg-strong)]">
        {value} {suffix}
        {Number(value) === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function LeadsChart({
  data,
}: {
  data: { date: string; label: string; leads: number }[];
}) {
  const max = Math.max(...data.map((point) => point.leads), 1);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="leads-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--a-border)" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: AXIS.stroke }}
            tickLine={false}
            tick={AXIS.tick}
            interval={Math.max(0, Math.floor(data.length / 6) - 1)}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, Math.max(4, max)]}
            axisLine={false}
            tickLine={false}
            tick={AXIS.tick}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: "var(--a-border-strong)", strokeWidth: 1 }}
            content={<TooltipCard suffix="lead" />}
          />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#leads-fill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--a-panel)" }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function HorizontalBars({
  data,
  suffix,
}: {
  data: { name: string; value: number }[];
  suffix: string;
}) {
  const height = Math.max(160, data.length * 38);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 34, bottom: 4, left: 0 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--a-muted)", fontSize: 12 }}
            width={120}
          />
          <Tooltip
            cursor={{ fill: "var(--a-hover)" }}
            content={<TooltipCard suffix={suffix} />}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} fill="var(--accent)">
            {data.map((entry) => (
              <Cell key={entry.name} fill="var(--accent)" />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              style={{ fill: "var(--a-fg)", fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ServiceInterestChart({ data }: { data: { name: string; value: number }[] }) {
  return <HorizontalBars data={data} suffix="lead" />;
}

export function SourceChart({ data }: { data: { name: string; value: number }[] }) {
  return <HorizontalBars data={data} suffix="lead" />;
}

export function ViewsChart({
  data,
}: {
  data: { label: string; views: number }[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
          <defs>
            <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.26} />
              <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--a-border)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: AXIS.stroke }}
            tickLine={false}
            tick={AXIS.tick}
            interval={Math.max(0, Math.floor(data.length / 6) - 1)}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={AXIS.tick}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: "var(--a-border-strong)", strokeWidth: 1 }}
            content={<TooltipCard suffix="view" />}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="var(--accent-2)"
            strokeWidth={2}
            fill="url(#views-fill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--a-panel)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
