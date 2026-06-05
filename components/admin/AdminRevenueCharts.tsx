"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  byCourse: { name: string; amount: number }[];
  transactions: { amount: number; status: string; created_at: string }[];
}

function buildMonthly(txs: Props["transactions"]) {
  const map: Record<string, number> = {};
  for (const t of txs) {
    if (t.status !== "paid") continue;
    const d = new Date(t.created_at);
    const key = d.toLocaleDateString("en-NG", { month: "short", year: "2-digit" });
    map[key] = (map[key] ?? 0) + Number(t.amount);
  }
  return Object.entries(map).slice(-6).map(([month, amount]) => ({ month, amount }));
}

export default function AdminRevenueCharts({ byCourse, transactions }: Props) {
  const monthly = buildMonthly(transactions);
  const fmt = (n: number) => n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M` : `₦${(n / 1000).toFixed(0)}k`;

  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-[14px] font-bold text-foreground mb-5">Monthly Revenue (Last 6 months)</h2>
        {monthly.length === 0 ? (
          <div className="flex items-center justify-center h-44 text-muted-foreground text-[13px]">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`₦${Number(v).toLocaleString("en-NG")}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="amount" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-[14px] font-bold text-foreground mb-5">Revenue by Course</h2>
        {byCourse.length === 0 ? (
          <div className="flex items-center justify-center h-44 text-muted-foreground text-[13px]">No data yet</div>
        ) : (
          <div className="space-y-3 max-h-44 overflow-y-auto">
            {byCourse.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-foreground truncate max-w-[60%]">{c.name}</span>
                  <span className="text-muted-foreground font-medium">₦{c.amount.toLocaleString("en-NG")}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, (c.amount / (byCourse[0]?.amount || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
