import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const withEnrollments = searchParams.get("withEnrollments") !== "false";

  const admin = createAdminClient();

  let q = admin
    .from("users")
    .select("id, full_name, email, student_id, phone, avatar_url, created_at, role")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (search) {
    q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
  }

  const { data: users, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!withEnrollments || !users?.length) {
    return NextResponse.json({ students: users ?? [] });
  }

  const userIds = (users as Array<{ id: string }>).map((u) => u.id);
  const { data: enrollments } = await admin
    .from("enrollments")
    .select("id, user_id, course_id, status, type, enrolled_at, courses(title)")
    .in("user_id", userIds)
    .eq("status", "active");

  const enrollmentsByUser: Record<string, unknown[]> = {};
  for (const e of (enrollments ?? []) as Array<{ user_id: string }>) {
    if (!enrollmentsByUser[e.user_id]) enrollmentsByUser[e.user_id] = [];
    enrollmentsByUser[e.user_id].push(e);
  }

  const students = (users as Array<{ id: string }>).map((u) => ({
    ...u,
    enrollments: enrollmentsByUser[u.id] ?? [],
  }));

  return NextResponse.json({ students });
}
