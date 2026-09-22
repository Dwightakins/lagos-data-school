import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/student/overview
// Server-side summary for the dashboard home and progress pages: profile, active
// enrollments (with course details), certificate count and completed-lesson count.
// Uses the admin client so RLS on `courses` (published-only) and NULL payment_status /
// status values on old enrollments can't hide a course the student is actually enrolled in.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [profileResult, enrollResult, certsResult, completedResult] = await Promise.all([
    admin.from("users").select("full_name, role, student_id").eq("id", user.id).single(),
    admin
      .from("enrollments")
      .select("id, status, type, enrolled_at, course:courses(id, title, description, price)")
      .eq("user_id", user.id)
      .or("status.eq.active,status.is.null")
      .or("payment_status.eq.paid,payment_status.is.null")
      .order("enrolled_at", { ascending: false }),
    admin.from("certificates").select("id", { count: "exact", head: true }).eq("student_id", user.id),
    admin.from("lesson_progress").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("completed", true),
  ]);

  if (enrollResult.error) return NextResponse.json({ error: enrollResult.error.message }, { status: 500 });

  return NextResponse.json({
    profile: profileResult.data ?? null,
    enrollments: enrollResult.data ?? [],
    certsCount: certsResult.count ?? 0,
    completedLessonsTotal: completedResult.count ?? 0,
  });
}
