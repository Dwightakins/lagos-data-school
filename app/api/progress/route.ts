import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ProgressBody {
  lessonId?: string;
  completed?: boolean;
}

interface LessonProgressRow {
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

// POST /api/progress — mark a lesson complete or incomplete
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      {
        student_id: user.id,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "student_id,lesson_id" }
    )
    .select("lesson_id, completed, completed_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ progress: data as LessonProgressRow });
}

// GET /api/progress?courseId=[id] — completion stats for a course
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  if (!courseId)
    return NextResponse.json({ error: "courseId is required." }, { status: 400 });

  const admin = createAdminClient();

  const { data: modules, error: modulesError } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  if (modulesError) return NextResponse.json({ error: modulesError.message }, { status: 500 });

  const moduleIds = ((modules ?? []) as Array<{ id: string }>).map((m) => m.id);

  if (moduleIds.length === 0) {
    return NextResponse.json({ totalLessons: 0, completedLessons: 0, completionPercent: 0, progress: [] });
  }

  const { data: lessons, error: lessonsError } = await admin
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds);

  if (lessonsError) return NextResponse.json({ error: lessonsError.message }, { status: 500 });

  const lessonIds = ((lessons ?? []) as Array<{ id: string }>).map((l) => l.id);
  const totalLessons = lessonIds.length;

  if (totalLessons === 0) {
    return NextResponse.json({ totalLessons: 0, completedLessons: 0, completionPercent: 0, progress: [] });
  }

  const { data: progress, error: progressError } = await admin
    .from("lesson_progress")
    .select("lesson_id, completed, completed_at")
    .eq("student_id", user.id)
    .in("lesson_id", lessonIds);

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 });

  const rows = (progress ?? []) as LessonProgressRow[];
  const completedLessons = rows.filter((p) => p.completed).length;
  const completionPercent = Math.round((completedLessons / totalLessons) * 100);

  return NextResponse.json({ totalLessons, completedLessons, completionPercent, progress: rows });
}
