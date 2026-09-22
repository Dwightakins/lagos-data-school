import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  reference: string;
  course_id: string;
  paid_at: string | null;
  courses?: { title: string } | null;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

// GET /api/admin/revenue
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
    // The payments table has no foreign key to users (only to courses), so `users(...)`
    // can't be embedded here — PostgREST rejects it (PGRST200). Names are fetched
    // separately below instead.
    const { data: rows, error } = await admin
      .from("payments")
      .select("id, user_id, amount, status, reference, course_id, paid_at, courses(title)")
      .order("paid_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const paymentRows = (rows ?? []) as unknown as PaymentRow[];
    const userIds = [...new Set(paymentRows.map((r) => r.user_id).filter(Boolean))];
    const { data: usersData, error: usersError } = userIds.length > 0
      ? await admin.from("users").select("id, full_name, email").in("id", userIds)
      : { data: [] as UserRow[], error: null };

    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

    const userMap = new Map(((usersData ?? []) as UserRow[]).map((u) => [u.id, u]));
    const transactions = paymentRows.map((r) => ({ ...r, user: userMap.get(r.user_id) ?? null }));

    const paidRows = transactions.filter((r) => r.status === "paid");
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sum = (rs: typeof paidRows) => rs.reduce((a, r) => a + Number(r.amount), 0);

    const allRevenue = sum(paidRows);
    const monthRevenue = sum(paidRows.filter((r) => r.paid_at && new Date(r.paid_at) >= firstOfMonth));
    const paidCount = paidRows.length;
    const avgOrderValue = paidCount > 0 ? Math.round(allRevenue / paidCount) : 0;

    return NextResponse.json({
      allRevenue,
      monthRevenue,
      transactionsCount: transactions.length,
      paidCount,
      avgOrderValue,
      transactions,
    });
  }

  if (type === "by-course") {
    const { data, error } = await admin
      .from("payments")
      .select("amount, course_id, courses ( title )")
      .eq("status", "paid");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
    const { data, error } = await admin.from("payments").select("amount, paid_at").eq("status", "paid");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const monthly: Record<string, number> = {};
    ((data ?? []) as Array<{ amount: number; paid_at: string | null }>).forEach((p) => {
      if (!p.paid_at) return;
      const key = p.paid_at.slice(0, 7); // YYYY-MM
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
