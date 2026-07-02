"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Award, Download, PlayCircle, Clock } from "lucide-react";

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  payment_type: "full" | "scholarship" | null;
  courses: {
    title: string;
    slug: string;
    description: string;
    duration: string | null;
    thumbnail_url: string | null;
    cover_image_url: string | null;
  } | null;
}

interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
}

interface CertRow {
  course_id: string;
}

function PayBadge({ type }: { type: "full" | "scholarship" | null }) {
  if (!type) return null;
  const label = type === "scholarship" ? "Scholarship" : "Full Pay";
  const cls = type === "scholarship"
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-brand" : "bg-amber-500";
  return (
    <div className="h-1.5 bg-border rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [certCourseIds, setCertCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [enrollResult, certsResult] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id, course_id, enrolled_at, payment_type, courses(title, slug, description, duration, thumbnail_url, cover_image_url)")
          .eq("user_id", user.id)
          .or("status.eq.active,status.is.null")
          .order("enrolled_at", { ascending: false }),
        supabase
          .from("certificates")
          .select("course_id")
          .eq("student_id", user.id)
          .eq("status", "active"),
      ]);

      const list = (enrollResult.data ?? []) as unknown as EnrolledCourse[];
      const certs = (certsResult.data ?? []) as CertRow[];
      setEnrollments(list);
      setCertCourseIds(new Set(certs.map((c) => c.course_id)));
      setLoading(false);

      // Fetch progress for each enrolled course
      const entries = await Promise.all(
        list.map(async (enr) => {
          try {
            const res = await fetch(`/api/progress?courseId=${enr.course_id}`);
            if (!res.ok) return null;
            return [enr.course_id, await res.json() as CourseProgress] as [string, CourseProgress];
          } catch { return null; }
        })
      );
      const map: Record<string, CourseProgress> = {};
      entries.forEach((e) => { if (e) map[e[0]] = e[1]; });
      setProgressMap(map);
    };
    void load();
  }, [router]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8">
        <div className="grid sm:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border h-56 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-bold text-foreground">My Courses</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {enrollments.length === 0
            ? "No courses enrolled yet"
            : `${enrollments.length} course${enrollments.length !== 1 ? "s" : ""} enrolled`}
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-brand" />
          </div>
          <h3 className="text-[16px] font-semibold text-foreground mb-2">No courses yet</h3>
          <p className="text-[13.5px] text-muted-foreground mb-6 max-w-xs leading-relaxed">
            You haven&apos;t enrolled in any courses yet. Browse our catalogue and start learning today.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-semibold text-[13px] px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {enrollments.map((enr) => {
            const course = enr.courses;
            if (!course) return null;
            const prog = progressMap[enr.course_id];
            const pct = prog?.completionPercent ?? 0;
            const done = prog?.completedLessons ?? 0;
            const total = prog?.totalLessons ?? 0;
            const nextLessonId = prog?.nextLessonId;
            const nextLessonTitle = prog?.nextLessonTitle;
            const hasCert = certCourseIds.has(enr.course_id);
            const thumbnail = course.thumbnail_url ?? course.cover_image_url;

            return (
              <div key={enr.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col hover:shadow-lg hover:border-brand/20 transition-all duration-200">
                {/* Thumbnail or gradient header */}
                <div className="relative h-36 bg-gradient-to-br from-brand/20 to-brand/5 shrink-0">
                  {thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-brand/30" />
                    </div>
                  )}
                  {/* Payment type badge */}
                  <div className="absolute top-3 left-3">
                    <PayBadge type={enr.payment_type} />
                  </div>
                  {/* Completion badge */}
                  {pct === 100 && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Completed
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-[15px] text-foreground leading-snug mb-1">{course.title}</h3>

                  {/* Duration and enrollment date */}
                  <div className="flex items-center gap-3 mb-3">
                    {course.duration && (
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />{course.duration}
                      </span>
                    )}
                    <span className="text-[12px] text-muted-foreground">
                      Enrolled {new Date(enr.enrolled_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Progress */}
                  {total > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[11.5px] mb-1.5">
                        <span className="text-muted-foreground">{done} of {total} lessons</span>
                        <span className={`font-bold ${pct === 100 ? "text-emerald-600" : "text-brand"}`}>{pct}%</span>
                      </div>
                      <ProgressBar pct={pct} />
                    </div>
                  )}

                  {/* Next lesson */}
                  {nextLessonTitle && pct < 100 && (
                    <p className="text-[11.5px] text-muted-foreground mb-3 truncate">
                      <span className="font-semibold text-foreground">Up next:</span> {nextLessonTitle}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-auto pt-3 border-t border-border flex flex-col gap-2">
                    {/* Continue / Start learning */}
                    <Link
                      href={nextLessonId ? `/learn/${enr.course_id}/${nextLessonId}` : `/learn/${enr.course_id}`}
                      className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-bold text-[13px] py-2.5 rounded-xl transition-opacity"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {pct > 0 ? "Continue Learning" : "Start Learning"}
                    </Link>

                    <div className="flex gap-2">
                      {/* View Materials */}
                      <Link
                        href="/dashboard/materials"
                        className="flex-1 flex items-center justify-center gap-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-brand/30 text-[12.5px] font-semibold py-2 rounded-xl transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Materials
                      </Link>

                      {/* View Certificate — only if 100% or cert already issued */}
                      {(pct === 100 || hasCert) && (
                        <Link
                          href="/dashboard/certificates"
                          className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[12.5px] font-bold py-2 rounded-xl transition-colors"
                        >
                          <Award className="w-3.5 h-3.5" /> Certificate
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
