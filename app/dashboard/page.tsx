import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, EnrolledCourse, ActivityItem } from "@/types";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsRow from "@/components/dashboard/StatsRow";
import MyCourses from "@/components/dashboard/MyCourses";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";

/* ── Supabase row shapes ─────────────────────────────────────────────────── */
type CourseRow = { id: string; title: string; cover_image_url: string | null; slug: string };
type EnrollmentRow = { id: string; course_id: string; enrolled_at: string; courses: CourseRow | null };
type ModuleRow = { id: string; course_id: string };
type LessonRow = { id: string; module_id: string };
type ProgressRow = { lesson_id: string };
type ActivityRow = {
  id: string;
  completed_at: string;
  lessons: { title: string; modules: { courses: { title: string } | null } | null } | null;
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getGreeting(): string {
  // WAT = UTC+1
  const hour = (new Date().getUTCHours() + 1) % 24;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* ── Parallel first-batch fetches ── */
  const [profileRes, enrollmentsRes, completedRes, certRes, activityRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, role, avatar_url, created_at, updated_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("enrollments")
      .select("id, course_id, enrolled_at, courses(id, title, cover_image_url, slug)")
      .eq("student_id", user.id)
      .eq("payment_status", "paid")
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("completed", true),
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id),
    supabase
      .from("lesson_progress")
      .select("id, completed_at, lessons(title, modules(courses(title)))")
      .eq("student_id", user.id)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(5),
  ]);

  /* ── Profile ── */
  const profile: Profile = profileRes.data ?? {
    id: user.id,
    email: user.email ?? "",
    full_name: user.user_metadata?.full_name ?? "",
    role: "student",
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  /* ── Enrolled courses + progress ── */
  const enrollmentRows = (enrollmentsRes.data ?? []) as unknown as EnrollmentRow[];
  const courseIds = enrollmentRows.map((e) => e.course_id);
  let enrolledCourses: EnrolledCourse[] = [];

  if (courseIds.length > 0) {
    const [modulesRes, allProgressRes] = await Promise.all([
      supabase.from("modules").select("id, course_id").in("course_id", courseIds),
      supabase.from("lesson_progress").select("lesson_id").eq("student_id", user.id).eq("completed", true),
    ]);

    const modules = (modulesRes.data ?? []) as ModuleRow[];
    const moduleIds = modules.map((m) => m.id);

    const lessonsData: LessonRow[] =
      moduleIds.length > 0
        ? (((await supabase.from("lessons").select("id, module_id").in("module_id", moduleIds)).data) ?? []) as LessonRow[]
        : [];

    const completedIds = new Set(((allProgressRes.data ?? []) as ProgressRow[]).map((p) => p.lesson_id));
    const moduleToCourseid: Record<string, string> = Object.fromEntries(modules.map((m) => [m.id, m.course_id]));

    const lessonsByCourse: Record<string, string[]> = {};
    for (const l of lessonsData) {
      const cid = moduleToCourseid[l.module_id];
      if (cid) {
        if (!lessonsByCourse[cid]) lessonsByCourse[cid] = [];
        lessonsByCourse[cid].push(l.id);
      }
    }

    enrolledCourses = enrollmentRows.map((e) => {
      const course = e.courses;
      const ids = lessonsByCourse[e.course_id] ?? [];
      const total = ids.length;
      const done = ids.filter((id) => completedIds.has(id)).length;
      return {
        enrollmentId: e.id,
        courseId: e.course_id,
        title: course?.title ?? "Unknown Course",
        coverImage: course?.cover_image_url ?? null,
        slug: course?.slug ?? e.course_id,
        enrolledAt: e.enrolled_at,
        totalLessons: total,
        completedLessons: done,
        progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });
  }

  /* ── Recent activity ── */
  const recentActivity: ActivityItem[] = ((activityRes.data ?? []) as unknown as ActivityRow[]).map((row) => ({
    id: row.id,
    lessonTitle: row.lessons?.title ?? "Lesson",
    courseName: row.lessons?.modules?.courses?.title ?? "Course",
    completedAt: row.completed_at,
  }));

  /* ── Derived values ── */
  const firstName = profile.full_name?.split(" ")[0] || "Student";
  const initial = firstName.charAt(0).toUpperCase();
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Desktop sidebar ── */}
      <Sidebar profile={profile} />

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0f172a] sticky top-0 z-30 shadow-lg">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#1e40af] flex items-center justify-center shadow-md">
            <span className="font-black text-white text-[11px] tracking-tight">LDS</span>
          </div>
          <span className="font-bold text-[13px] text-white">Lagos Data School</span>
        </Link>
        <div className="flex items-center gap-2">
          <button aria-label="Notifications" className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Bell className="w-[18px] h-[18px]" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#1e40af] flex items-center justify-center ring-2 ring-white/10">
            <span className="text-white font-bold text-[12px]">{initial}</span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="lg:ml-[260px] min-h-screen pb-24 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardHeader greeting={greeting} firstName={firstName} today={today} />
          <div className="space-y-8">
            <StatsRow
              enrolledCourses={enrolledCourses.length}
              completedLessons={completedRes.count ?? 0}
              assignmentsDue={0}
              certificatesEarned={certRes.count ?? 0}
            />
            <MyCourses courses={enrolledCourses} />
            <RecentActivity items={recentActivity} />
            <QuickActions />
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <MobileBottomNav />
    </div>
  );
}
