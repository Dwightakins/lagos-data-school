import { createAdminClient } from "@/lib/supabase/admin";
import { DollarSign, TrendingUp, CreditCard, BarChart2 } from "lucide-react";
import AdminRevenueCharts from "@/components/admin/AdminRevenueCharts";

async function getData() {
  const admin = createAdminClient();
  const [payments, byCourse] = await Promise.all([
    admin.from("payments").select("amount, status, created_at, reference, users(full_name, email), courses(title)").order("created_at", { ascending: false }),
    admin.from("payments").select("amount, courses(title)").eq("status", "paid"),
  ]);

  const txs = (payments.data ?? []) as unknown as Array<{
    amount: number; status: string; created_at: string; reference: string;
    users: { full_name: string; email: string } | null;
    courses: { title: string } | null;
  }>;

  const total = txs.filter((t) => t.status === "paid").reduce((s, t) => s + Number(t.amount), 0);
  const now = new Date();
  const thisMonth = txs.filter((t) => {
    const d = new Date(t.created_at);
    return t.status === "paid" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, t) => s + Number(t.amount), 0);

  const courseRevMap: Record<string, number> = {};
  for (const p of (byCourse.data ?? []) as unknown as Array<{ amount: number; courses: { title: string } | null }>) {
    const title = p.courses?.title ?? "Unknown";
    courseRevMap[title] = (courseRevMap[title] ?? 0) + Number(p.amount);
  }
  const byCourseArr = Object.entries(courseRevMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);

  return { total, thisMonth, transactions: txs, byCourse: byCourseArr };
}

export default async function RevenuePage() {
  const { total, thisMonth, transactions, byCourse } = await getData();

  const fmt = (n: number) => n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(2)}M` : `₦${n.toLocaleString("en-NG")}`;

  const STATUS_STYLE: Record<string, string> = {
    paid: "text-green-400 bg-green-500/10",
    pending: "text-yellow-400 bg-yellow-500/10",
    failed: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-1">Admin Panel</p>
        <h1 className="text-[1.75rem] font-bold text-foreground">Revenue</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Financial overview and transaction history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: fmt(total), Icon: DollarSign },
          { label: "This Month", value: fmt(thisMonth), Icon: TrendingUp },
          { label: "Transactions", value: String(transactions.length), Icon: CreditCard },
          { label: "Paid Count", value: String(transactions.filter((t) => t.status === "paid").length), Icon: BarChart2 },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-brand/8 flex items-center justify-center mb-3">
              <s.Icon className="w-4 h-4 text-brand" />
            </div>
            <p className="text-[1.65rem] font-black text-foreground">{s.value}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminRevenueCharts byCourse={byCourse} transactions={transactions} />

      {/* Transaction Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mt-8">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-[15px] font-bold text-foreground">All Transactions</h2>
          <span className="text-[12px] text-muted-foreground">{transactions.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No transactions yet.</td></tr>
              ) : transactions.map((t, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-foreground">{t.users?.full_name ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{t.users?.email ?? ""}</p>
                  </td>
                  <td className="px-5 py-3 text-foreground">{t.courses?.title ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-foreground">{fmt(Number(t.amount))}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLE[t.status] ?? "text-muted-foreground bg-muted"}`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-[11px]">{t.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

