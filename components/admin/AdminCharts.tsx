"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { RefreshCw } from "lucide-react";

const BRAND = "#722F37";
const BRAND_LIGHT = "#a3505a";
const BRAND_DIM = "#c47a84";
const COLORS = [BRAND, BRAND_LIGHT, BRAND_DIM, "#e2b3b8", "#9b4a53"];
const REFRESH_INTERVAL_MS = 60_000;

interface MonthlyPoint {
  month: string;
  enrollments: number;
  revenue: number;
}

interface CoursePoint {
  name: string;
  revenue: number;
  enrollments: number;
}

interface ChartsData {
  monthly: MonthlyPoint[];
  bycourse: CoursePoint[];
}

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n}`;
}

function timeAgoLabel(ts: number) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
};

export default function AdminCharts() {
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [tickLabel, setTickLabel] = useState("just now");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/charts", { cache: "no-store" });
      const d = (await res.json()) as ChartsData;
      setData(d);
      setLastUpdated(Date.now());
      setTickLabel("just now");
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + 60s auto-refresh
  useEffect(() => {
    void fetchData();
    intervalRef.current = setInterval(() => { void fetchData(); }, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Update "X ago" label every 15s
  useEffect(() => {
    tickRef.current = setInterval(() => {
      if (lastUpdated) setTickLabel(timeAgoLabel(lastUpdated));
    }, 15_000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [lastUpdated]);

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 h-[280px] animate-pulse" />
        ))}
      </div>
    );
  }

  const hasMonthlyData =
    !!data && data.monthly.some((m) => m.enrollments > 0 || m.revenue > 0);
  if (!data || (!hasMonthlyData && data.bycourse.length === 0)) {
    return (
      <div className="mt-6">
        <h2 className="text-[14px] font-bold text-foreground mb-4">Analytics</h2>
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-foreground font-semibold mb-1">No data yet</p>
          <p className="text-muted-foreground text-[13px]">
            Charts will appear here once students start enrolling and paying.
          </p>
        </div>
      </div>
    );
  }

  const shortName = (n: string) => n.length > 14 ? n.slice(0, 13) + "…" : n;

  return (
    <div className="mt-6">
      {/* Header row with timestamp + refresh button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-bold text-foreground">Analytics</h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11.5px] text-muted-foreground">
              Updated {tickLabel}
            </span>
          )}
          <button
            onClick={() => { void fetchData(true); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-brand border border-brand/30 hover:bg-brand/5 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-[15px] font-bold text-foreground mb-0.5">Enrollment Trends</h2>
          <p className="text-[12px] text-muted-foreground mb-4">Monthly enrollments (last 6 months)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke={BRAND}
                strokeWidth={2.5}
                dot={{ fill: BRAND, r: 4 }}
                activeDot={{ r: 6 }}
                name="Enrollments"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-[15px] font-bold text-foreground mb-0.5">Monthly Revenue</h2>
          <p className="text-[12px] text-muted-foreground mb-4">Revenue trend (last 6 months)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => fmt(v)} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: unknown) => [fmt(Number(v ?? 0)), "Revenue"] as [string, string]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={BRAND_LIGHT}
                strokeWidth={2.5}
                dot={{ fill: BRAND_LIGHT, r: 4 }}
                activeDot={{ r: 6 }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue per Course */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-[15px] font-bold text-foreground mb-0.5">Revenue per Course</h2>
          <p className="text-[12px] text-muted-foreground mb-4">Total revenue by course</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.bycourse} layout="vertical" margin={{ left: 0, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => fmt(v)} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                width={88}
                tickFormatter={shortName}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: unknown) => [fmt(Number(v ?? 0)), "Revenue"] as [string, string]}
              />
              <Bar dataKey="revenue" fill={BRAND} radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Popularity */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-[15px] font-bold text-foreground mb-0.5">Course Popularity</h2>
          <p className="text-[12px] text-muted-foreground mb-4">Enrollments by course</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.bycourse}
                dataKey="enrollments"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={30}
              >
                {data.bycourse.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: unknown) => [Number(v ?? 0), "Enrollments"] as [number, string]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {data.bycourse.map((c, idx) => (
              <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                {shortName(c.name)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
