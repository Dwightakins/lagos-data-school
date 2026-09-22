import { createAdminClient } from "@/lib/supabase/admin";
import { DollarSign, TrendingUp, CreditCard, BarChart2, AlertTriangle } from "lucide-react";
import AdminRevenueCharts from "@/components/admin/AdminRevenueCharts";

// This page has no dynamic APIs (no cookies()/headers()), so Next.js would otherwise
// statically prerender it once at build time and serve that frozen snapshot forever —
// new payments would never show up no matter what the query below returns.
export const dynamic = "force-dynamic";

interface PaymentRow {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  reference: string;
  status: string;
  provider: string;
  paid_at: string | null;
  courses: { title: string } | null;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

async function getData() {
  const admin = createAdminClient();

  // The payments table has no foreign key to users (only to courses), so `users(...)`
  // can't be embedded in this select — PostgREST rejects it outright (PGRST200), which
  // is what was 500ing this page. Student names are fetched separately below instead.
  const { data: paymentsData, error } = await admin
    .from("payments")
    .select("id, user_id, course_id, amount, reference, status, provider, paid_at, courses(title)")
    .order("paid_at", { ascending: false });

  if (error) {
    return { error: error.message, total: 0, thisMonth: 0, paidCount: 0, transactions: [], byCourse: [] };
  }

  const rows = (paymentsData ?? []) as unknown as PaymentRow[];

  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  const { data: usersData, error: usersError } = userIds.length > 0
    ? await admin.from("users").select("id, full_name, email").in("id", userIds)
    : { data: [] as UserRow[], error: null };

  if (usersError) {
    return { error: usersError.message, total: 0, thisMonth: 0, paidCount: 0, transactions: [], byCourse: [] };
  }

  const userMap = new Map(((usersData ?? []) as UserRow[]).map((u) => [u.id, u]));
  const transactions = rows.map((r) => ({ ...r, user: userMap.get(r.user_id) ?? null }));

  const paidTxs = transactions.filter((t) => t.status === "paid");
  const total = paidTxs.reduce((s, t) => s + Number(t.amount), 0);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = paidTxs
    .filter((t) => t.paid_at && new Date(t.paid_at) >= firstOfMonth)
    .reduce((s, t) => s + Number(t.amount), 0);

  const courseRevMap: Record<string, number> = {};
  for (const p of paidTxs) {
    const title = p.courses?.title ?? "Unknown";
    courseRevMap[title] = (courseRevMap[title] ?? 0) + Number(p.amount);
  }
  const byCourse = Object.entries(courseRevMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { error: null as string | null, total, thisMonth, paidCount: paidTxs.length, transactions, byCourse };
}

export default async function RevenuePage() {
  const { error, total, thisMonth, paidCount, transactions, byCourse } = await getData();

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

      {error ? (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 rounded-2xl p-5 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[14px]">Couldn&apos;t load revenue data</p>
            <p className="text-[13px] mt-1 opacity-90">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Revenue", value: fmt(total), Icon: DollarSign },
              { label: "This Month", value: fmt(thisMonth), Icon: TrendingUp },
              { label: "Transactions", value: String(paidCount), Icon: CreditCard },
              { label: "Paid Count", value: String(paidCount), Icon: BarChart2 },
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
                  ) : transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-foreground">{t.user?.full_name ?? "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{t.user?.email ?? ""}</p>
                      </td>
                      <td className="px-5 py-3 text-foreground">{t.courses?.title ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">{fmt(Number(t.amount))}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLE[t.status] ?? "text-muted-foreground bg-muted"}`}>{t.status}</span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{t.paid_at ? new Date(t.paid_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground font-mono text-[11px]">{t.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
