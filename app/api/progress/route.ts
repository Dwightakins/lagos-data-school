import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueCourseCertificate } from "@/lib/certificates";

interface ProgressBody {
  lessonId?: string;
  completed?: boolean;
  courseId?: string; // optional: helps auto-cert check without extra lookup
}

interface LessonProgressRow {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

// POST /api/progress — mark a lesson complete or incomplete
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ProgressBody;
  try {
    body = (await request.json()) as ProgressBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { lessonId, completed } = body;
  if (!lessonId || completed === undefined) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_progress")
    .upsert(
      { student_id: user.id, lesson_id: lessonId, completed, completed_at: completed ? new Date().toISOString() : null },
      { onConflict: "student_id,lesson_id" }
    )
    .select("lesson_id, completed, completed_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // When marking a lesson complete, check if the whole course is now done
  if (completed) {
    // Fire-and-forget: don't block the response
    void (async () => {
      try {
        // Resolve lesson → module → course
        const { data: lesson } = await admin
          .from("lessons")
          .select("module_id")
          .eq("id", lessonId)
          .single();
        if (!lesson) return;

        const { data: module } = await admin
          .from("modules")
          .select("course_id")
          .eq("id", (lesson as { module_id: string }).module_id)
          .single();
        if (!module) return;

        const courseId = (module as { course_id: string }).course_id;

        // Get total lesson count for the course
        const { data: allModules } = await admin.from("modules").select("id").eq("course_id", courseId);
        const allModuleIds = (allModules ?? []).map((m: { id: string }) => m.id);

        const { data: allLessons } = await admin.from("lessons").select("id").in("module_id", allModuleIds);
        const allLessonIds = (allLessons ?? []).map((l: { id: string }) => l.id);

        const { data: completedRows } = await admin
          .from("lesson_progress")
          .select("lesson_id")
          .eq("student_id", user.id)
          .eq("completed", true)
          .in("lesson_id", allLessonIds);

        const pct = allLessonIds.length > 0
          ? Math.round(((completedRows?.length ?? 0) / allLessonIds.length) * 100)
          : 0;

        // Update completion_percentage on enrollment
        await admin
          .from("enrollments")
          .update({ completion_percentage: pct })
          .eq("user_id", user.id)
          .eq("course_id", courseId);

        if (pct === 100) {
          // Mark completed_at if not already set
          await admin
            .from("enrollments")
            .update({ completed_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .is("completed_at", null);

          // Issue certificate (idempotent)
          await issueCourseCertificate(user.id, courseId);
        }
      } catch {
        // Non-fatal — cert can be claimed manually from dashboard
      }
    })();
  }

  return NextResponse.json({ progress: data as LessonProgressRow });
}

// GET /api/progress?courseId=[id] — completion stats including next lesson
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId is required." }, { status: 400 });

  const admin = createAdminClient();

  const { data: modules, error: modulesError } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index");

  if (modulesError) return NextResponse.json({ error: modulesError.message }, { status: 500 });

  const moduleIds = ((modules ?? []) as Array<{ id: string }>).map((m) => m.id);
  if (moduleIds.length === 0) {
    return NextResponse.json({ totalLessons: 0, completedLessons: 0, completionPercent: 0, progress: [], nextLessonId: null, nextLessonTitle: null });
  }

  const { data: lessons, error: lessonsError } = await admin
    .from("lessons")
    .select("id, title")
    .in("module_id", moduleIds)
    .order("order_index");

  if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 });

  const lessonList = (lessons ?? []) as Array<{ id: string; title: string }>;
  const lessonIds = lessonList.map((l) => l.id);
  const totalLessons = lessonIds.length;

  if (totalLessons === 0) {
    return NextResponse.json({ totalLessons: 0, completedLessons: 0, completionPercent: 0, progress: [], nextLessonId: null, nextLessonTitle: null });
  }

  const { data: progress, error: progressError } = await admin
    .from("lesson_progress")
    .select("lesson_id, completed, completed_at")
    .eq("student_id", user.id)
    .in("lesson_id", lessonIds);

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 });

  const rows = (progress ?? []) as LessonProgressRow[];
  const completedSet = new Set(rows.filter((p) => p.completed).map((p) => p.lesson_id));
  const completedLessons = completedSet.size;
  const completionPercent = Math.round((completedLessons / totalLessons) * 100);

  const nextLesson = lessonList.find((l) => !completedSet.has(l.id)) ?? lessonList[0];

  return NextResponse.json({
    totalLessons,
    completedLessons,
    completionPercent,
    progress: rows,
    nextLessonId: nextLesson?.id ?? null,
    nextLessonTitle: nextLesson?.title ?? null,
  });
}
