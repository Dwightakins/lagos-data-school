import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const [allPay, monthPay, yearPay, transactions] = await Promise.all([
      admin.from("payments").select("amount").eq("status", "paid"),
      admin.from("payments").select("amount").eq("status", "paid").gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      admin.from("payments").select("amount").eq("status", "paid").gte("created_at", new Date(new Date().getFullYear(), 0, 1).toISOString()),
      admin.from("payments").select("id, amount, created_at, reference, user_id, course_id, users(full_name), courses(title)").eq("status", "paid").order("created_at", { ascending: false }).limit(50),
    ]);

    const sum = (rows: Array<{ amount: number }>) => rows.reduce((a, r) => a + Number(r.amount), 0);
    const allPayRows = (allPay.data ?? []) as Array<{ amount: number }>;
    const monthPayRows = (monthPay.data ?? []) as Array<{ amount: number }>;
    const yearPayRows = (yearPay.data ?? []) as Array<{ amount: number }>;
    const allRevenue = sum(allPayRows);
    const monthRevenue = sum(monthPayRows);
    const yearRevenue = sum(yearPayRows);
    const avgOrderValue = allPayRows.length > 0 ? Math.round(allRevenue / allPayRows.length) : 0;

    return NextResponse.json({
      allRevenue, monthRevenue, yearRevenue, avgOrderValue,
      transactions: transactions.data ?? [],
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
    return NextResponse.json({ byCourse: Object.entries(courseMap).map(([id, v]) => ({ courseId: id, ...v })) });
  }

  if (type === "monthly") {
    const { data } = await admin.from("payments").select("amount, created_at").eq("status", "paid").order("created_at");
    const monthly: Record<string, number> = {};
    ((data ?? []) as Array<{ amount: number; created_at: string }>).forEach((p) => {
      const key = p.created_at.slice(0, 7);
      monthly[key] = (monthly[key] ?? 0) + Number(p.amount);
    });
    return NextResponse.json({ monthly: Object.entries(monthly).map(([month, revenue]) => ({ month, revenue })) });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
