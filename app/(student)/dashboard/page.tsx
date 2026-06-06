"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart2, Cpu, Code2, Wrench, Terminal, Database,
  BookOpen, Award, User,
  GraduationCap, TrendingUp, ArrowRight, Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { LucideProps } from "lucide-react";

type LucideIcon = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

interface Profile {
  full_name: string | null;
  role: string | null;
  student_id: string | null;
}

interface Enrollment {
  id: string;
  status: string;
  type: string;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    description: string;
    price: number;
  } | null;
}

interface CourseProgress {
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
}

interface AvailableCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  duration?: string;
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


export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [completedLessonsTotal, setCompletedLessonsTotal] = useState(0);
  const [certsCount, setCertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) { router.push("/login"); return; }

      const [profileResult, enrollResult] = await Promise.all([
        supabase.from("users").select("full_name, role, student_id").eq("id", user.id).single(),
        supabase
          .from("enrollments")
          .select("id, status, type, enrolled_at, course:courses(id, title, description, price)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("enrolled_at", { ascending: false }),
      ]);

      const enrolledList = (enrollResult.data ?? []) as unknown as Enrollment[];
      setUser(user);
      setProfile(profileResult.data);
      setEnrollments(enrolledList);
      setLoading(false);

      const courseIds = enrolledList.map((e) => e.course?.id).filter(Boolean) as string[];
      const enrolledIdSet = new Set(courseIds);

      const [progressEntries, certsResult, completedResult, coursesRes] = await Promise.all([
        Promise.all(
          courseIds.map(async (courseId) => {
            try {
              const res = await fetch(`/api/progress?courseId=${courseId}`);
              if (!res.ok) return null;
              const data = await res.json() as CourseProgress;
              return [courseId, data] as [string, CourseProgress];
            } catch {
              return null;
            }
          })
        ),
        supabase
          .from("certificates")
          .select("id", { count: "exact", head: true })
          .eq("student_id", user.id),
        supabase
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("student_id", user.id)
          .eq("completed", true),
        fetch("/api/courses").then((r) => r.json()).catch(() => ({ courses: [] })) as Promise<{ courses: AvailableCourse[] }>,
      ]);

      const map: Record<string, CourseProgress> = {};
      progressEntries.forEach((entry) => { if (entry) map[entry[0]] = entry[1]; });
      setProgressMap(map);
      setCertsCount(certsResult.count ?? 0);
      setCompletedLessonsTotal(completedResult.count ?? 0);
      const allCourses = (coursesRes.courses ?? []) as AvailableCourse[];
      setAvailableCourses(allCourses.filter((c) => !enrolledIdSet.has(c.id)));
    };

    load();
  }, [router]);

  const firstName = profile?.full_name?.split(" ")[0] || user?.email || "Student";

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-40 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border">
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <Skeleton className="h-5 w-28 mb-5" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border rounded-2xl p-5">
                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">

          {/* Welcome */}
          <div className="mb-8">
            <p className="text-[11.5px] font-bold text-brand uppercase tracking-[0.28em] mb-1">
              Student Portal
            </p>
            <h1 className="text-[1.75rem] font-bold text-foreground leading-tight">
              Hello,{" "}
              <span className="text-brand">{firstName}</span>!
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-[14px] text-muted-foreground">
                Here&apos;s what&apos;s happening with your learning journey.
              </p>
              {profile?.student_id && (
                <span className="inline-flex items-center gap-1.5 bg-brand/10 border border-brand/20 text-brand text-[11px] font-mono font-bold px-3 py-1 rounded-full shrink-0">
                  <GraduationCap className="w-3 h-3" />
                  {profile.student_id}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {[
              { label: "Enrolled Courses", value: enrollments.length, Icon: GraduationCap },
              { label: "Completed Lessons", value: completedLessonsTotal, Icon: TrendingUp },
              { label: "Certificates Earned", value: certsCount, Icon: Award },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="relative bg-card rounded-2xl p-6 border border-border shadow-sm">
                <GlowingEffect spread={20} glow={false} disabled={false} proximity={60} inactiveZone={0.1} borderWidth={2} />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-brand" />
                  </div>
                </div>
                <p className="text-[2rem] font-black text-foreground">{value}</p>
                <p className="text-[12.5px] text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* My Courses */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-foreground">My Courses</h2>
              <Link href="/courses" className="text-[13px] text-brand font-semibold hover:underline">
                Browse more →
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-brand mx-auto mb-4" />
                <p className="text-[14px] text-muted-foreground mb-5">You have no active courses yet.</p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-bold text-[13px] px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Browse Courses <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((enr) => {
                  const course = enr.course;
                  if (!course) return null;
                  const Icon = getCourseIcon(course.title);
                  const progress = progressMap[course.id];
                  return (
                    <div
                      key={enr.id}
                      className="relative bg-muted border border-border rounded-2xl p-5 hover:border-brand/30 hover:shadow-md transition-all duration-300"
                    >
                      <GlowingEffect spread={15} glow={false} disabled={false} proximity={50} inactiveZone={0.1} borderWidth={1.5} />
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-brand" />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          enr.type === "scholarship"
                            ? "bg-(--border) text-muted-foreground"
                            : "bg-brand/10 text-brand"
                        }`}>
                          {enr.type === "scholarship" ? "Scholarship" : "Full Pay"}
                        </span>
                      </div>

                      <h3 className="font-bold text-foreground text-[13.5px] leading-snug mb-1">
                        {course.title}
                      </h3>
                      <p className="text-[11.5px] text-muted-foreground line-clamp-2 mb-3">
                        {course.description}
                      </p>

                      {progress ? (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10.5px] text-muted-foreground">
                              {progress.completedLessons}/{progress.totalLessons} lessons
                            </span>
                            <span className={`text-[10.5px] font-bold ${
                              progress.completionPercent > 75
                                ? "text-emerald-600 dark:text-emerald-400"
                                : progress.completionPercent >= 25
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                            }`}>
                              {progress.completionPercent}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                progress.completionPercent > 75
                                  ? "bg-emerald-500"
                                  : progress.completionPercent >= 25
                                  ? "bg-amber-500"
                                  : "bg-muted-foreground/40"
                              }`}
                              style={{ width: `${progress.completionPercent}%` }}
                              title={`${progress.completedLessons} of ${progress.totalLessons} lessons completed`}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3 h-1.5 bg-border rounded-full" />
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-[10.5px] text-muted-foreground">
                          {new Date(enr.enrolled_at).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                        <Link
                          href={`/learn/${course.id}`}
                          className="text-[11.5px] font-bold text-brand hover:underline"
                        >
                          Continue →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discover Courses */}
          {availableCourses.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-bold text-foreground">Discover More Courses</h2>
                <Link href="/courses" className="text-[13px] text-brand font-semibold hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCourses.slice(0, 3).map((course) => {
                  const Icon = getCourseIcon(course.title);
                  return (
                    <div
                      key={course.id}
                      className="relative bg-muted border border-border rounded-2xl p-5 hover:border-brand/30 hover:shadow-md transition-all duration-300"
                    >
                      <GlowingEffect spread={15} glow={false} disabled={false} proximity={50} inactiveZone={0.1} borderWidth={1.5} />
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-brand" />
                      </div>
                      <h3 className="font-bold text-foreground text-[13.5px] leading-snug mb-1">
                        {course.title}
                      </h3>
                      {course.duration && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </div>
                      )}
                      <p className="text-[11.5px] text-muted-foreground line-clamp-2 mb-4">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-[13px] font-black text-brand">
                          ₦{course.price.toLocaleString("en-NG")}
                        </span>
                        <Link
                          href={`/checkout?courseId=${course.id}`}
                          className="text-[11.5px] font-bold text-brand bg-brand/10 hover:bg-brand hover:text-brand-foreground px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Enroll Now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Browse Courses", desc: "Explore all available courses", href: "/courses", Icon: BookOpen },
              { title: "My Certificates", desc: "View your earned certificates", href: "/dashboard/certificates", Icon: Award },
              { title: "My Profile", desc: "Update your profile information", href: "/dashboard/profile", Icon: User },
            ].map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="relative bg-card rounded-2xl border border-border p-5 hover:border-brand/30 hover:shadow-md transition-all duration-300 group shadow-sm"
              >
                <GlowingEffect spread={15} glow={false} disabled={false} proximity={50} inactiveZone={0.1} borderWidth={1.5} />
                <link.Icon className="w-5 h-5 text-brand mb-2.5" />
                <p className="font-bold text-foreground text-[13.5px]">{link.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{link.desc}</p>
                <ArrowRight className="w-3.5 h-3.5 text-brand mt-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
    </main>
  );
}

