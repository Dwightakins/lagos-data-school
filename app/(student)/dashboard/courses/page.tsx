"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, BarChart2, Cpu, Code2, Wrench, Terminal, Database,
} from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { LucideProps } from "lucide-react";

type LucideIcon = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  courses: { title: string; slug: string; description: string } | null;
}

interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
}

function getCourseIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("data anal") || t.includes("analytics")) return BarChart2;
  if (t.includes("machine learn") || t.includes("neural") || t.includes(" ml")) return Cpu;
  if (t.includes("software") || t.includes("full-stack") || t.includes("web dev")) return Code2;
  if (t.includes("data eng") || t.includes("pipeline")) return Wrench;
  if (t.includes("python")) return Terminal;
  if (t.includes("sql") || t.includes("database")) return Database;
  return BookOpen;
}

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const enrollResult = await supabase
        .from("enrollments")
        .select("id, course_id, enrolled_at, courses(title, slug, description)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false });

      const list = (enrollResult.data ?? []) as unknown as EnrolledCourse[];
      setEnrollments(list);
      setLoading(false);

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
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-6 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[1.5rem] font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {enrollments.length} course{enrollments.length !== 1 ? "s" : ""} enrolled
          </p>
        </div>
        <Link href="/courses" className="hidden sm:inline text-[13px] font-semibold text-brand hover:underline">
          Browse more →
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-brand" />
          </div>
          <h3 className="text-[16px] font-semibold text-foreground mb-2">No courses yet</h3>
          <p className="text-[13.5px] text-muted-foreground mb-6 max-w-xs leading-relaxed">
            Browse our catalogue and enroll in your first course to get started.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-semibold text-[13px] px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrollments.map((enr) => {
            const course = enr.courses;
            if (!course) return null;
            const Icon = getCourseIcon(course.title);
            const prog = progressMap[enr.course_id];
            const pct = prog?.completionPercent ?? 0;
            const done = prog?.completedLessons ?? 0;
            const total = prog?.totalLessons ?? 0;

            return (
              <Link
                key={enr.id}
                href={`/learn/${enr.course_id}`}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-brand/30 hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
              >
                <div className="w-11 h-11 rounded-xl bg-brand/10 flex items-center justify-center mb-4 shrink-0 group-hover:bg-brand/15 transition-colors">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-bold text-[14.5px] text-foreground leading-snug mb-1.5 group-hover:text-brand transition-colors">
                  {course.title}
                </h3>
                <p className="text-[12.5px] text-muted-foreground line-clamp-2 mb-4 flex-1">{course.description}</p>
                {total > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[11.5px] mb-1.5">
                      <span className="text-muted-foreground">{done}/{total} lessons</span>
                      <span className="font-bold text-brand">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 75 ? "bg-emerald-500" : pct >= 25 ? "bg-amber-500" : "bg-brand"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[11px] text-muted-foreground">
                    Enrolled {new Date(enr.enrolled_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-[12.5px] font-bold text-brand group-hover:translate-x-0.5 transition-transform">
                    {pct > 0 ? "Continue →" : "Start →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
