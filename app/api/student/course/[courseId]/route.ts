import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface LessonRow {
  id: string;
  title: string;
  duration_minutes: number | null;
  order_index: number;
  module_id: string;
}

interface ModuleRow {
  id: string;
  title: string;
  order_index: number;
  lessons: LessonRow[];
}

// GET /api/student/course/[courseId]
// Server-side data for a single enrolled course's syllabus page: profile first name,
// course details, and its modules/lessons. Uses the admin client so RLS on `courses`
// (published-only) and NULL status/payment_status enrollments can't wrongly 404 a
// course the student is actually enrolled in.
export async function GET(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .or("status.eq.active,status.is.null")
    .or("payment_status.eq.paid,payment_status.is.null")
    .maybeSingle();

  if (!enrollment) return NextResponse.json({ error: "Not enrolled in this course." }, { status: 403 });

  const [profileRes, courseRes, modulesRes] = await Promise.all([
    admin.from("users").select("full_name").eq("id", user.id).single(),
    admin.from("courses").select("id, title, description, cover_image_url").eq("id", courseId).single(),
    admin.from("modules").select("id, title, order_index").eq("course_id", courseId).order("order_index"),
  ]);

  if (!courseRes.data) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const moduleList = (modulesRes.data ?? []) as Omit<ModuleRow, "lessons">[];
  const moduleIds = moduleList.map((m) => m.id);

  const { data: allLessonsRaw } = moduleIds.length
    ? await admin
        .from("lessons")
        .select("id, title, duration_minutes, order_index, module_id")
        .in("module_id", moduleIds)
        .order("order_index")
    : { data: [] };

  const allLessons = (allLessonsRaw ?? []) as LessonRow[];
  const lessonsByModule: Record<string, LessonRow[]> = {};
  for (const lesson of allLessons) {
    (lessonsByModule[lesson.module_id] ??= []).push(lesson);
  }

  const modules: ModuleRow[] = moduleList.map((m) => ({
    ...m,
    lessons: lessonsByModule[m.id] ?? [],
  }));

  return NextResponse.json({
    firstName: (profileRes.data?.full_name as string | null)?.split(" ")[0] ?? user.email ?? "Student",
    course: courseRes.data,
    modules,
  });
}
