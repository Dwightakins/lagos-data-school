import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  reference: string;
  course_id: string;
  paid_at?: string | null;
  created_at?: string | null;
  users?: { full_name: string } | null;
  courses?: { title: string } | null;
}

// "*" (not a named column list) on every query below so this works whether the payments
// date column is paid_at or created_at — naming a column that doesn't exist in .select(),
// .gte() or .order() fails the whole query, which used to make this route return all zeros.
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "overview";

  if (type === "overview") {
    const [paidPay, transactions] = await Promise.all([
      admin.from("payments").select("*").eq("status", "paid"),
      admin.from("payments").select("*, users(full_name, email), courses(title)"),
    ]);

    const paidRows = ((paidPay.data ?? []) as PaymentRow[])
      .map((p) => ({ ...p, date: p.paid_at ?? p.created_at ?? null }));

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sum = (rows: typeof paidRows) => rows.reduce((a, r) => a + Number(r.amount), 0);

    const allRevenue = sum(paidRows);
    const monthRevenue = sum(paidRows.filter((r) => r.date && new Date(r.date) >= firstOfMonth));
    const paidCount = paidRows.length;
    const avgOrderValue = paidCount > 0 ? Math.round(allRevenue / paidCount) : 0;

    const allTxRows = ((transactions.data ?? []) as PaymentRow[])
      .map((t) => ({ ...t, date: t.paid_at ?? t.created_at ?? null }))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

    return NextResponse.json({
      allRevenue,
      monthRevenue,
      transactionsCount: allTxRows.length,
      paidCount,
      avgOrderValue,
      transactions: allTxRows,
    });
  }

  if (type === "by-course") {
    const { data } = await admin
      .from("payments")
      .select("amount, course_id, courses ( title )")
      .eq("status", "paid");

    const courseMap: Record<string, { title: string; count: number; revenue: number }> = {};
    ((data ?? []) as Array<{ amount: number; course_id: string; courses: { title: string } | null }>).forEach((p) => {
      if (!courseMap[p.course_id]) courseMap[p.course_id] = { title: p.courses?.title ?? "—", count: 0, revenue: 0 };
      courseMap[p.course_id].count++;
      courseMap[p.course_id].revenue += Number(p.amount);
    });
    const byCourse = Object.entries(courseMap)
      .map(([id, v]) => ({ courseId: id, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
    return NextResponse.json({ byCourse });
  }

  if (type === "monthly") {
    const { data } = await admin.from("payments").select("*").eq("status", "paid");

    const monthly: Record<string, number> = {};
    ((data ?? []) as PaymentRow[]).forEach((p) => {
      const date = p.paid_at ?? p.created_at ?? null;
      if (!date) return;
      const key = date.slice(0, 7); // YYYY-MM
      monthly[key] = (monthly[key] ?? 0) + Number(p.amount);
    });

    const last6 = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({ month, revenue }));

    return NextResponse.json({ monthly: last6 });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
