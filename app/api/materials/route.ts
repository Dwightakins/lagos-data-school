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

  // No enrollments → nothing to show
  if (courseIds.length === 0) return NextResponse.json({ materials: [] });

  // Return materials for enrolled courses OR marked visible to all enrolled students
  const orFilter = `course_id.in.(${courseIds.join(",")}),visible_to_all.eq.true`;

  const { data, error } = await admin
    .from("lesson_materials")
    .select("id, file_name, file_url, file_type, file_size, course_id, lesson_id, visible_to_all, created_at, lessons(title, modules(title, courses(title)))")
    .or(orFilter)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ materials: data ?? [] });
}
