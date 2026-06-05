import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });

  const admin = createAdminClient();

  const { data: lesson } = await admin
    .from("lessons")
    .select("id, modules(course_id)")
    .eq("id", lessonId)
    .single();

  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const moduleData = lesson.modules as { course_id: string } | { course_id: string }[] | null;
  const courseId = Array.isArray(moduleData) ? moduleData[0]?.course_id : moduleData?.course_id;

  if (courseId) {
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("lesson_materials")
    .select("id, title, file_url, file_type, file_size, created_at")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data ?? [] });
}
