import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/api-auth";

function lastNMonths(n: number): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-NG", { month: "short" }),
    });
  }
  return result;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const months = lastNMonths(6);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [enrollmentsRes, paymentsRes, coursesRes] = await Promise.all([
    admin
      .from("enrollments")
      .select("enrolled_at, payment_status")
      .gte("enrolled_at", sixMonthsAgo.toISOString()),
    // "*" (not a named column list) so this works whether the date column is paid_at or
    // created_at — and the 6-month cutoff is applied in JS below for the same reason
    // (a .gte() naming a column that doesn't exist would fail the whole query).
    admin
      .from("payments")
      .select("*")
      .eq("status", "paid"),
    admin.from("courses").select("id, title"),
  ]);

  type EnrollRow = { enrolled_at: string; payment_status: string };
  type PaymentRow = { amount: number; course_id: string; status: string; paid_at?: string | null; created_at?: string | null };
  type CourseRow = { id: string; title: string };

  const enrollments = (enrollmentsRes.data ?? []) as EnrollRow[];
  const payments = ((paymentsRes.data ?? []) as PaymentRow[])
    .map((p) => ({ ...p, date: p.paid_at ?? p.created_at ?? null }))
    .filter((p) => p.date && p.date >= sixMonthsAgo.toISOString());
  const courses = (coursesRes.data ?? []) as CourseRow[];

  // Monthly enrollment counts
  const enrollByMonth: Record<string, number> = {};
  months.forEach(({ key }) => { enrollByMonth[key] = 0; });
  enrollments.forEach((e) => {
    const key = e.enrolled_at.slice(0, 7);
    if (enrollByMonth[key] !== undefined) enrollByMonth[key]++;
  });

  // Monthly revenue
  const revenueByMonth: Record<string, number> = {};
  months.forEach(({ key }) => { revenueByMonth[key] = 0; });
  payments.forEach((p) => {
    const key = (p.date ?? "").slice(0, 7);
    if (revenueByMonth[key] !== undefined) revenueByMonth[key] += Number(p.amount);
  });

  const monthly = months.map(({ key, label }) => ({
    month: label,
    enrollments: enrollByMonth[key] ?? 0,
    revenue: revenueByMonth[key] ?? 0,
  }));

  // Revenue + enrollments by course
  const courseMap = new Map(courses.map((c) => [c.id, c.title]));
  const courseRevenue: Record<string, { revenue: number; enrollments: number }> = {};

  payments.forEach((p) => {
    if (!courseRevenue[p.course_id]) courseRevenue[p.course_id] = { revenue: 0, enrollments: 0 };
    courseRevenue[p.course_id].revenue += Number(p.amount);
    courseRevenue[p.course_id].enrollments++;
  });

  const bycourse = Object.entries(courseRevenue)
    .map(([courseId, stats]) => ({
      name: courseMap.get(courseId) ?? "Unknown",
      revenue: stats.revenue,
      enrollments: stats.enrollments,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return NextResponse.json({ monthly, bycourse });
}
