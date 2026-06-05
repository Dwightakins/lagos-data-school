import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface EnrollmentRaw {
  id: string;
  enrolled_at: string;
  payment_status: string;
  user_id: string;
  course_id: string;
}

interface PaymentRaw {
  id: string;
  amount: number;
  reference: string;
  status: string;
  paid_at: string | null;
  provider: string;
  user_id: string;
  course_id: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
}

interface CourseRow {
  id: string;
  title: string;
}

// GET /api/admin/stats — dashboard metrics for admins
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Run all independent queries in parallel
  const [
    studentsResult,
    revenueResult,
    coursesResult,
    scholarshipsResult,
    enrollmentsResult,
    paymentsResult,
  ] = await Promise.all([
    admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    admin
      .from("payments")
      .select("amount")
      .eq("status", "paid"),
    admin
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
    admin
      .from("scholarship_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("enrollments")
      .select("id, enrolled_at, payment_status, user_id, course_id")
      .order("enrolled_at", { ascending: false })
      .limit(10),
    admin
      .from("payments")
      .select("id, amount, reference, status, paid_at, provider, user_id, course_id")
      .order("paid_at", { ascending: false })
      .limit(10),
  ]);

  const totalStudents = studentsResult.count ?? 0;
  const totalRevenue = ((revenueResult.data ?? []) as Array<{ amount: number }>).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const activeCourses = coursesResult.count ?? 0;
  const pendingScholarships = scholarshipsResult.count ?? 0;

  const enrollmentRows = (enrollmentsResult.data ?? []) as EnrollmentRaw[];
  const paymentRows = (paymentsResult.data ?? []) as PaymentRaw[];

  // Batch-fetch user and course details for the recent activity rows
  const allUserIds = [
    ...new Set([
      ...enrollmentRows.map((e) => e.user_id),
      ...paymentRows.map((p) => p.user_id),
    ]),
  ];
  const allCourseIds = [
    ...new Set([
      ...enrollmentRows.map((e) => e.course_id),
      ...paymentRows.map((p) => p.course_id),
    ]),
  ];

  const fetchUsers = async () =>
    allUserIds.length > 0
      ? admin.from("users").select("id, full_name, email").in("id", allUserIds)
      : Promise.resolve({ data: [] as UserRow[] });

  const fetchCourseDetails = async () =>
    allCourseIds.length > 0
      ? admin.from("courses").select("id, title").in("id", allCourseIds)
      : Promise.resolve({ data: [] as CourseRow[] });

  const [usersDetail, coursesDetail] = await Promise.all([
    fetchUsers(),
    fetchCourseDetails(),
  ]);

  const usersMap = new Map(
    ((usersDetail.data ?? []) as UserRow[]).map((u) => [u.id, u])
  );
  const coursesMap = new Map(
    ((coursesDetail.data ?? []) as CourseRow[]).map((c) => [c.id, c])
  );

  const recentEnrollments = enrollmentRows.map((e) => ({
    id: e.id,
    enrolled_at: e.enrolled_at,
    payment_status: e.payment_status,
    user: usersMap.get(e.user_id) ?? null,
    course: coursesMap.get(e.course_id) ?? null,
  }));

  const recentPayments = paymentRows.map((p) => ({
    id: p.id,
    amount: p.amount,
    reference: p.reference,
    status: p.status,
    paid_at: p.paid_at,
    provider: p.provider,
    user: usersMap.get(p.user_id) ?? null,
    course: coursesMap.get(p.course_id) ?? null,
  }));

  return NextResponse.json({
    totalStudents,
    totalRevenue,
    activeCourses,
    pendingScholarships,
    recentEnrollments,
    recentPayments,
  });
}

