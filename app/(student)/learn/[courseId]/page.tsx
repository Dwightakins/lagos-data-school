import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function ComingSoon({ courseTitle }: { courseTitle: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-500/10">
          <BookOpen className="h-7 w-7 text-green-600 dark:text-green-500" />
        </span>
        <h1 className="text-[1.4rem] font-bold text-foreground mb-2">{courseTitle}</h1>
        <p className="text-[14.5px] text-muted-foreground leading-relaxed mb-8">
          Course content coming soon. Our instructors are preparing your modules and
          lessons — you&apos;ll be notified as soon as they&apos;re published.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-green-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

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

  const { data: courseRow } = await admin
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .maybeSingle();
  const courseTitle = (courseRow as { title?: string } | null)?.title ?? "Your course";

  // Load all lessons in order
  const { data: modulesData } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .order("order_index");

  const moduleIds = ((modulesData ?? []) as Array<{ id: string }>).map(m => m.id);
  if (!moduleIds.length) return <ComingSoon courseTitle={courseTitle} />;

  const { data: lessonsData } = await admin
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds)
    .order("order_index");

  const allLessons = (lessonsData ?? []) as Array<{ id: string }>;
  if (!allLessons.length) return <ComingSoon courseTitle={courseTitle} />;

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
