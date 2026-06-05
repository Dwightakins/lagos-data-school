import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, slug, description, price, duration, cover_image_url, published")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  const { data: modules } = await admin
    .from("modules")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const moduleList = (modules ?? []) as Array<{ id: string; title: string; order_index: number }>;

  type LessonRow = { id: string; title: string; order_index: number; duration_minutes: number | null; module_id: string };

  const lessonsMap: Record<string, LessonRow[]> = {};
  if (moduleList.length > 0) {
    const { data: lessons } = await admin
      .from("lessons")
      .select("id, title, order_index, duration_minutes, module_id")
      .in("module_id", moduleList.map((m) => m.id))
      .order("order_index", { ascending: true });

    for (const lesson of (lessons ?? []) as LessonRow[]) {
      if (!lessonsMap[lesson.module_id]) lessonsMap[lesson.module_id] = [];
      lessonsMap[lesson.module_id].push(lesson);
    }
  }

  const modulesWithLessons = moduleList.map((m) => ({
    ...m,
    lessons: lessonsMap[m.id] ?? [],
  }));

  return NextResponse.json({ course, modules: modulesWithLessons });
}

