import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { AppLogo } from "@/components/layout/logo";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Play, Award,
  BookOpen, ChevronRight, BarChart2,
} from "lucide-react";

interface ModuleRow { id: string; title: string; order_index: number; }
interface LessonRow { id: string; title: string; duration_minutes: number | null; order_index: number; module_id: string; }
interface CourseRow { id: string; title: string; description: string | null; }
interface EnrollmentRow { id: string; enrolled_at: string; }

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Verify paid enrollment
  const { data: enrollmentData } = await admin
    .from("enrollments")
    .select("id, enrolled_at")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("payment_status", "paid")
    .maybeSingle();

  if (!enrollmentData) redirect("/courses");
  const enrollment = enrollmentData as EnrollmentRow;

  // Load course
  const { data: courseData } = await admin
    .from("courses")
    .select("id, title, description")
    .eq("id", courseId)
    .single();

  if (!courseData) notFound();
  const course = courseData as CourseRow;

  // Load modules + lessons
  const { data: modulesData } = await admin
    .from("modules")
    .select("id, title, order_index")
    .eq("course_id", courseId)
    .order("order_index");

  const moduleList = (modulesData ?? []) as ModuleRow[];
  const moduleIds = moduleList.map(m => m.id);
  if (moduleIds.length === 0) notFound();

  const { data: lessonsData } = await admin
    .from("lessons")
    .select("id, title, duration_minutes, order_index, module_id")
    .in("module_id", moduleIds)
    .order("order_index");

  const allLessons = (lessonsData ?? []) as LessonRow[];
  if (allLessons.length === 0) notFound();

  // Load progress
  const { data: progressData } = await admin
    .from("lesson_progress")
    .select("lesson_id, completed")
    .eq("student_id", user.id)
    .in("lesson_id", allLessons.map(l => l.id));

  const progressMap = Object.fromEntries(
    ((progressData ?? []) as Array<{ lesson_id: string; completed: boolean }>)
      .map(p => [p.lesson_id, p.completed])
  );

  const completedCount = allLessons.filter(l => progressMap[l.id]).length;
  const totalLessons = allLessons.length;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isAllComplete = totalLessons > 0 && completedCount >= totalLessons;

  // Resume from first incomplete lesson; fallback to first lesson
  const resumeLesson = allLessons.find(l => !progressMap[l.id]) ?? allLessons[0];

  const modulesWithLessons = moduleList.map(m => ({
    ...m,
    lessons: allLessons.filter(l => l.module_id === m.id),
  }));

  const totalMinutes = allLessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-foreground text-background h-14 flex items-center px-4 sm:px-6 gap-2 border-b border-background/8">
        <Link
          href="/dashboard/courses"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-background/60 hover:text-background hover:bg-background/10 transition-colors shrink-0"
          aria-label="Back to my courses"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="hidden sm:block ml-1 shrink-0">
          <AppLogo size="sm" onDark href="/dashboard" subtitle={false} />
        </div>
        <div className="hidden md:flex items-center gap-2 ml-2 min-w-0">
          <span className="text-background/25">/</span>
          <span className="text-[13px] font-medium text-background/60 truncate max-w-[220px]">{course.title}</span>
        </div>
        <Link
          href="/dashboard"
          className="ml-auto text-[12.5px] font-semibold text-background/50 hover:text-background transition-colors hidden sm:block shrink-0"
        >
          Dashboard
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Course hero */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[1.5rem] sm:text-[1.75rem] font-black text-foreground leading-tight mb-2">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-[14px] text-muted-foreground leading-relaxed">{course.description}</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-[12.5px] text-muted-foreground mb-5 pb-5 border-b border-border">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand" />
              {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
            </span>
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand" />
                {hours > 0 ? `${hours}h ` : ""}{mins > 0 ? `${mins}m` : ""} total
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-brand" />
              Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-foreground">
                {isAllComplete ? "Course Complete!" : "Your Progress"}
              </span>
              <span className="text-[13px] font-black text-brand">{pct}%</span>
            </div>
            <div className="h-2.5 bg-border rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[12px] text-muted-foreground">
              {completedCount} of {totalLessons} lessons complete
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isAllComplete ? (
              <>
                <Link
                  href="/dashboard/certificates"
                  className="flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-[14px] px-6 py-3 rounded-xl transition-colors shadow-md shadow-orange-500/20 min-h-[44px]"
                >
                  <Award className="w-4 h-4" /> View Certificate
                </Link>
                <Link
                  href={`/learn/${courseId}/${allLessons[0].id}`}
                  className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-[14px] px-6 py-3 rounded-xl transition-colors border border-border min-h-[44px]"
                >
                  <Play className="w-4 h-4" /> Review Course
                </Link>
              </>
            ) : (
              <Link
                href={`/learn/${courseId}/${resumeLesson.id}`}
                className="inline-flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white font-bold text-[14px] px-6 py-3 rounded-xl transition-opacity shadow-sm min-h-[44px]"
              >
                <Play className="w-4 h-4" />
                {completedCount > 0 ? "Continue Learning" : "Start Learning"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Curriculum */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-[15px] font-bold text-foreground">Course Curriculum</h2>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              {moduleList.length} module{moduleList.length !== 1 ? "s" : ""} · {totalLessons} lessons
            </p>
          </div>

          {modulesWithLessons.map((mod, mi) => {
            const moduleDone = mod.lessons.filter(l => progressMap[l.id]).length;
            return (
              <div key={mod.id} className="border-b border-border last:border-0">
                <div className="flex items-center justify-between px-6 py-3.5 bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded bg-brand/10 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-brand">{mi + 1}</span>
                    </div>
                    <span className="text-[13px] font-bold text-foreground truncate">{mod.title}</span>
                  </div>
                  <span className="text-[11.5px] text-muted-foreground shrink-0 ml-2">
                    {moduleDone}/{mod.lessons.length}
                  </span>
                </div>

                {mod.lessons.map(lesson => {
                  const done = !!progressMap[lesson.id];
                  const isNext = lesson.id === resumeLesson?.id && !isAllComplete;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/learn/${courseId}/${lesson.id}`}
                      className={`flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors border-t border-border/50 group ${isNext ? "bg-brand/[0.04]" : ""}`}
                    >
                      {done
                        ? <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                        : <Circle className={`w-4 h-4 shrink-0 ${isNext ? "text-brand" : "text-muted-foreground/35"}`} />}

                      <span className={`flex-1 text-[13px] min-w-0 truncate ${
                        done ? "text-muted-foreground" : isNext ? "font-semibold text-brand" : "text-foreground"
                      }`}>
                        {lesson.title}
                      </span>

                      {isNext && (
                        <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full shrink-0">
                          Next up
                        </span>
                      )}
                      {lesson.duration_minutes && (
                        <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{lesson.duration_minutes}m
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-brand/50 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
