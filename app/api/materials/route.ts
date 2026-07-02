import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get all courses this student is actively enrolled in
  const { data: enrollments } = await admin
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .or("status.eq.active,status.is.null");

  const courseIds = (enrollments ?? []).map((e: { course_id: string }) => e.course_id);
  if (courseIds.length === 0) return NextResponse.json({ materials: [] });

  // Get module IDs for enrolled courses (needed for lesson-linked materials)
  const { data: modules } = await admin
    .from("modules")
    .select("id")
    .in("course_id", courseIds);

  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);

  let lessonIds: string[] = [];
  if (moduleIds.length > 0) {
    const { data: lessons } = await admin
      .from("lessons")
      .select("id")
      .in("module_id", moduleIds);
    lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
  }

  let query = admin
    .from("lesson_materials")
    .select("id, file_name, file_url, file_type, file_size, course_id, lesson_id, created_at, lessons(title, modules(title, courses(title)))")
    .order("created_at", { ascending: false });

  if (lessonIds.length > 0) {
    query = query.or(`course_id.in.(${courseIds.join(",")}),lesson_id.in.(${lessonIds.join(",")})`);
  } else {
    query = query.in("course_id", courseIds);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ materials: data ?? [] });
}
