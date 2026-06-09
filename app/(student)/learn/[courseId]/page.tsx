import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function LearnCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Verify paid enrollment before letting them in
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) redirect("/courses");

  // Load all lessons in order
  const { data: modulesData } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index");

  const moduleIds = ((modulesData ?? []) as Array<{ id: string }>).map(m => m.id);
  if (!moduleIds.length) notFound();

  const { data: lessonsData } = await admin
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds)
    .order("order_index");

  const allLessons = (lessonsData ?? []) as Array<{ id: string }>;
  if (!allLessons.length) notFound();

  // Find the resume lesson: first incomplete lesson, fallback to lesson 1
  const { data: progressData } = await admin
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", user.id)
    .eq("completed", true)
    .in("lesson_id", allLessons.map(l => l.id));

  const completedIds = new Set(
    ((progressData ?? []) as Array<{ lesson_id: string }>).map(p => p.lesson_id)
  );

  const resumeLesson = allLessons.find(l => !completedIds.has(l.id)) ?? allLessons[0];

  redirect(`/learn/${courseId}/${resumeLesson.id}`);
}
