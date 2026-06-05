"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  Award, ArrowLeft, Play, Clock, BookOpen,
} from "lucide-react";

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

interface CourseDetails {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
}

interface ProgressData {
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  progress: Array<{ lesson_id: string; completed: boolean }>;
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [allComplete, setAllComplete] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (!enrollment) { router.push("/dashboard/courses"); return; }

    const [profileRes, courseRes] = await Promise.all([
      supabase.from("users").select("full_name").eq("id", user.id).single(),
      supabase.from("courses").select("id, title, description, cover_image_url").eq("id", courseId).single(),
    ]);

    setFirstName(profileRes.data?.full_name?.split(" ")[0] || user.email || "Student");
    if (!courseRes.data) { router.push("/dashboard/courses"); return; }
    setCourse(courseRes.data as CourseDetails);

    const { data: modulesData } = await supabase
      .from("modules")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .order("order_index");

    const moduleList = (modulesData ?? []) as Omit<ModuleRow, "lessons">[];
    const withLessons: ModuleRow[] = await Promise.all(
      moduleList.map(async (m) => {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id, title, duration_minutes, order_index, module_id")
          .eq("module_id", m.id)
          .order("order_index");
        return { ...m, lessons: (lessons ?? []) as LessonRow[] };
      })
    );
    setModules(withLessons);
    setExpandedModules(new Set(withLessons.map((m) => m.id)));

    const res = await fetch(`/api/progress?courseId=${courseId}`);
    if (res.ok) {
      const data = await res.json() as ProgressData;
      setProgressData(data);
      const allLessons = withLessons.flatMap((m) => m.lessons);
      setAllComplete(allLessons.length > 0 && data.completedLessons >= allLessons.length);
    }

    setLoading(false);
  }, [courseId, router]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  const allLessons = modules.flatMap((m) => m.lessons);
  const progressMap = Object.fromEntries(
    (progressData?.progress ?? []).map((p) => [p.lesson_id, p.completed])
  );
  const continueLessonId = allLessons.find((l) => !progressMap[l.id])?.id ?? allLessons[0]?.id;
  const progressPct = progressData?.completionPercent ?? 0;
  const completedCount = progressData?.completedLessons ?? 0;
  const totalCount = progressData?.totalLessons ?? allLessons.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D9488]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground text-white px-6 py-4 flex items-center justify-between border-b border-white/8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#134E4A] flex items-center justify-center shadow-md shadow-brand/30">
            <span className="font-black text-white text-[11px] tracking-tight">LDS</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-[13px] tracking-tight">Lagos Data School</span>
            <span className="text-[9px] text-brand/80 font-bold tracking-[0.2em] uppercase">Limited</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-white/70">{firstName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[13px] text-white/70 hover:text-white border border-white/15 hover:border-white/35 px-3 py-1.5 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-brand transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          My Courses
        </Link>

        {course && (
          <>
            {/* Course header */}
            <div className="bg-card rounded-2xl border border-brand/40 overflow-hidden mb-6 shadow-sm">
              {course.cover_image_url && (
                <div className="relative h-48 sm:h-64 overflow-hidden">
                  <Image
                    src={course.cover_image_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 896px) 100vw, 896px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#132128]/60 to-transparent" />
                </div>
              )}
              <div className="p-6 sm:p-8">
                <h1 className="text-[1.5rem] sm:text-[1.75rem] font-black text-foreground leading-tight mb-2">
                  {course.title}
                </h1>
                <p className="text-[14.5px] text-muted-foreground leading-relaxed mb-6">{course.description}</p>

                <div className="mb-6">
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="text-muted-foreground font-medium">
                      {completedCount} of {totalCount} lessons completed
                    </span>
                    <span className="font-bold text-brand">{progressPct}%</span>
                  </div>
                  <div className="h-2.5 bg-[#e7e9ea] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0D9488] to-[#2DD4BF] rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {continueLessonId && (
                    <Link
                      href={`/learn/${courseId}/${continueLessonId}`}
                      className="inline-flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-[14px] px-7 py-3 rounded-xl transition-all shadow-md shadow-[#EA580C]/20 hover:scale-[1.02] active:scale-[0.97]"
                    >
                      <Play className="w-4 h-4" />
                      {progressPct > 0 ? "Continue Learning" : "Start Course"}
                    </Link>
                  )}
                  {allComplete && (
                    <Link
                      href="/dashboard/certificates"
                      className="inline-flex items-center justify-center gap-2 bg-foreground hover:bg-[#1e3036] text-white font-bold text-[14px] px-7 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.97]"
                    >
                      <Award className="w-4 h-4" />
                      View Certificate
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Syllabus */}
            <div className="bg-card rounded-2xl border border-brand/40 overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="text-[1.1rem] font-bold text-foreground">Course Syllabus</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {modules.length} module{modules.length !== 1 ? "s" : ""} · {totalCount} lesson{totalCount !== 1 ? "s" : ""}
                </p>
              </div>

              {modules.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <BookOpen className="w-8 h-8 text-brand mb-3" />
                  <p className="text-[14px] text-muted-foreground">Course content is being prepared.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#e7e9ea]">
                  {modules.map((mod, mi) => {
                    const modLessons = mod.lessons;
                    const completedInMod = modLessons.filter((l) => progressMap[l.id]).length;
                    const isExpanded = expandedModules.has(mod.id);
                    const totalDuration = modLessons.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);

                    return (
                      <div key={mod.id}>
                        <button
                          type="button"
                          onClick={() => toggleModule(mod.id)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-background border border-brand/40/50 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-black text-brand">{mi + 1}</span>
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-foreground">{mod.title}</p>
                              <p className="text-[12px] text-muted-foreground">
                                {completedInMod}/{modLessons.length} lessons
                                {totalDuration > 0 && ` · ${totalDuration} min`}
                              </p>
                            </div>
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          }
                        </button>

                        {isExpanded && (
                          <ul className="border-t border-border bg-[#FAFAFA]">
                            {modLessons.map((lesson, li) => {
                              const done = !!progressMap[lesson.id];
                              const isContinue = lesson.id === continueLessonId && !allComplete;
                              return (
                                <li key={lesson.id}>
                                  <Link
                                    href={`/learn/${courseId}/${lesson.id}`}
                                    className={`flex items-center gap-3 px-6 py-3 text-[13.5px] hover:bg-background transition-colors group ${isContinue ? "bg-background" : ""}`}
                                  >
                                    {done
                                      ? <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                                      : <Circle className="w-4 h-4 text-[#CBD5E1] shrink-0 group-hover:text-brand transition-colors" />
                                    }
                                    <span className={`flex-1 ${done ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                                      {li + 1}. {lesson.title}
                                    </span>
                                    {isContinue && (
                                      <span className="text-[11px] font-bold text-[#EA580C] bg-[#EA580C]/10 px-2 py-0.5 rounded-full shrink-0">
                                        Continue
                                      </span>
                                    )}
                                    {lesson.duration_minutes && (
                                      <span className="text-[11.5px] text-muted-foreground shrink-0 flex items-center gap-1 ml-2">
                                        <Clock className="w-3 h-3" />
                                        {lesson.duration_minutes}m
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

