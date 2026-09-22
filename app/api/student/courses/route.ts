import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface LessonRow {
  id: string;
  title: string;
  video_url: string | null;
  zoom_link: string | null;
  zoom_schedule: string | null;
  is_live: boolean;
  order_index: number;
  module_id: string;
}

// GET /api/student/courses
// Returns the signed-in student's enrolled courses, plus each course's next live
// session (if any lesson is marked is_live with a zoom_link) and last recorded lesson
// (the most recent lesson with a video_url), for the "My Courses" dashboard.
// Uses the admin client so RLS on courses (published-only) cannot hide a course the
// student has paid for.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("enrollments")
    .select("id, course_id, enrolled_at, type, courses(title, slug, description, duration, thumbnail_url, cover_image_url)")
    .eq("user_id", user.id)
    .or("status.eq.active,status.is.null")
    .or("payment_status.eq.paid,payment_status.is.null")
    .order("enrolled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enrollments = data ?? [];
  const courseIds = [...new Set(enrollments.map((e: { course_id: string }) => e.course_id))];

  const liveByCourse: Record<string, { lessonId: string; zoomLink: string; schedule: string | null }> = {};
  const lastRecordingByCourse: Record<string, { lessonId: string; title: string }> = {};

  if (courseIds.length > 0) {
    const { data: modulesData } = await admin
      .from("modules")
      .select("id, course_id")
      .in("course_id", courseIds);
    const moduleToCourse = new Map<string, string>(
      (modulesData ?? []).map((m: { id: string; course_id: string }) => [m.id, m.course_id])
    );
    const moduleIds = [...moduleToCourse.keys()];

    if (moduleIds.length > 0) {
      const { data: lessonsData } = await admin
        .from("lessons")
        .select("id, title, video_url, zoom_link, zoom_schedule, is_live, order_index, module_id")
        .in("module_id", moduleIds)
        .order("order_index");

      for (const lesson of (lessonsData ?? []) as LessonRow[]) {
        const courseId = moduleToCourse.get(lesson.module_id);
        if (!courseId) continue;

        if (!liveByCourse[courseId] && lesson.is_live && lesson.zoom_link) {
          liveByCourse[courseId] = { lessonId: lesson.id, zoomLink: lesson.zoom_link, schedule: lesson.zoom_schedule };
        }
        // Lessons arrive ordered by order_index, so the last one seen with a video is the
        // most recent recording.
        if (!lesson.is_live && lesson.video_url) {
          lastRecordingByCourse[courseId] = { lessonId: lesson.id, title: lesson.title };
        }
      }
    }
  }

  const enriched = enrollments.map((e: { course_id: string }) => ({
    ...e,
    nextLive: liveByCourse[e.course_id] ?? null,
    lastRecording: lastRecordingByCourse[e.course_id] ?? null,
  }));

  return NextResponse.json({ enrollments: enriched });
}
