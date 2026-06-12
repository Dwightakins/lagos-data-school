export const revalidate = 3600;
export const dynamicParams = true;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Course, Module, Lesson } from "@/types";
import CourseEnrollCTA from "@/components/ui/CourseEnrollCTA";
import { BackButton } from "@/components/ui/back-button";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import {
  BarChart2, Cpu, Code2, Wrench, Terminal, Database,
  TrendingUp, BookOpen, CheckCircle2, Video, Download,
  MessageSquare, Award, Infinity, ChevronRight,
  Clock, PlayCircle, FileText, ChevronDown,
} from "lucide-react";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function CourseIcon({ slug }: { slug: string }) {
  const className = "w-7 h-7 text-brand";
  if (slug.includes("data-anal") || slug.includes("analytics")) return <BarChart2 className={className} />;
  if (slug.includes("machine") || slug.includes("ml") || slug.includes("ai")) return <Cpu className={className} />;
  if (slug.includes("software") || slug.includes("web") || slug.includes("dev")) return <Code2 className={className} />;
  if (slug.includes("data-eng") || slug.includes("pipeline")) return <Wrench className={className} />;
  if (slug.includes("python")) return <Terminal className={className} />;
  if (slug.includes("sql") || slug.includes("database")) return <Database className={className} />;
  if (slug.includes("power-bi") || slug.includes("tableau") || slug.includes("viz")) return <TrendingUp className={className} />;
  return <BookOpen className={className} />;
}

export async function generateStaticParams() {
  const { createAdminClient: _c } = await import("@/lib/supabase/admin");
  const supabase = _c();
  const { data } = await supabase.from("courses").select("id").eq("published", true);
  return ((data ?? []) as Array<{ id: string }>).map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("courses")
    .select("title, description")
    .eq("id", id)
    .single();

  if (!data) return { title: "Course — Lagos Data School" };
  const title = `${data.title} — Lagos Data School`;
  const description = data.description as string;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://lagosdataschool.com/courses/${id}`,
    },
  };
}

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

function ModuleRow({ module, index }: { module: ModuleWithLessons; index: number }) {
  const moduleDuration = module.lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);

  return (
    <details className="group border border-border hover:border-brand/40 rounded-xl bg-card transition-colors open:border-brand/40 open:shadow-sm">
      <summary className="flex items-center gap-4 p-4 cursor-pointer list-none select-none">
        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
          <span className="text-[12px] font-bold text-brand">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold text-foreground leading-snug">{module.title}</h4>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[12px] text-muted-foreground">
              {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
            </span>
            {moduleDuration > 0 && (
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {fmtDuration(moduleDuration)}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
      </summary>

      {module.lessons.length > 0 && (
        <div className="px-4 pb-4 border-t border-border mt-0 pt-3 space-y-1">
          {module.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted transition-colors"
            >
              {lesson.video_url ? (
                <PlayCircle className="w-4 h-4 text-brand shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 text-[13px] text-foreground">{lesson.title}</span>
              {lesson.duration_minutes && lesson.duration_minutes > 0 && (
                <span className="text-[11.5px] text-muted-foreground shrink-0 font-medium">
                  {fmtDuration(lesson.duration_minutes)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </details>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));

  const fetchData = Promise.all([
    supabase
      .from("courses")
      .select("id, title, slug, description, price, cover_image_url, published, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("modules")
      .select("id, course_id, title, description, order_index, created_at, lessons(id, module_id, title, video_url, duration_minutes, order_index, created_at)")
      .eq("course_id", id)
      .order("order_index"),
  ]);

  const raceResult = await Promise.race([fetchData, timeout]);
  if (!raceResult) notFound();

  const [courseResult, modulesResult] = raceResult as Awaited<typeof fetchData>;

  if (courseResult.error || !courseResult.data) {
    notFound();
  }

  const course = courseResult.data as Course;

  const modules: ModuleWithLessons[] = ((modulesResult.data ?? []) as (Module & { lessons: Lesson[] })[]).map(
    (mod) => ({
      ...mod,
      lessons: (mod.lessons ?? []).sort((a, b) => a.order_index - b.order_index),
    })
  );

  const allLessons = modules.flatMap((m) => m.lessons);

  const totalLessons = allLessons.length;
  const totalMinutes = allLessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />

      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <BackButton label="Courses" className="hover:text-brand" />
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className="text-foreground font-medium truncate">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero banner */}
      <div className="bg-foreground text-background border-b border-border/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="max-w-2xl">
            <div className="w-14 h-14 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center mb-5">
              <CourseIcon slug={course.slug} />
            </div>
            <h1 className="text-[2rem] sm:text-[2.4rem] font-black leading-tight mb-4">
              {course.title}
            </h1>
            <p className="text-[15px] text-background/70 leading-relaxed mb-6">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-background/10 text-background/90 px-3 py-1 rounded-full font-semibold text-[12px]">
                {modules.length} {modules.length === 1 ? "Module" : "Modules"}
              </span>
              {totalLessons > 0 && (
                <span className="bg-background/10 text-background/90 px-3 py-1 rounded-full font-semibold text-[12px]">
                  {totalLessons} Lessons
                </span>
              )}
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1.5 bg-background/10 text-background/90 px-3 py-1 rounded-full font-semibold text-[12px]">
                  <Clock className="w-3.5 h-3.5" />
                  {fmtDuration(totalMinutes)} total
                </span>
              )}
              <span className="bg-background/10 text-background/90 px-3 py-1 rounded-full font-semibold text-[12px]">
                Verified Certificate
              </span>
              <span className="bg-background/10 text-background/90 px-3 py-1 rounded-full font-semibold text-[12px]">
                Project-Based
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content + sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: main content */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* What you'll learn */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-[1.1rem] font-bold text-foreground mb-5">What you&apos;ll learn</h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {[
                  "Real-world, hands-on projects",
                  "Industry-standard tools & workflows",
                  "Peer learning and community support",
                  "Weekly live sessions with mentors",
                  "Job-ready portfolio by end of course",
                  "Verified digital certificate",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Course Description */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-[1.1rem] font-bold text-foreground mb-3">About this course</h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {/* Syllabus / Curriculum */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[1.1rem] font-bold text-foreground">Course Curriculum</h2>
                {(totalLessons > 0 || totalMinutes > 0) && (
                  <div className="flex items-center gap-4 text-[12.5px] text-muted-foreground">
                    {totalLessons > 0 && <span>{totalLessons} lessons</span>}
                    {totalMinutes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {fmtDuration(totalMinutes)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {modules.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted border-2 border-border flex items-center justify-center mx-auto mb-3">
                    <Wrench className="w-5 h-5 text-brand" />
                  </div>
                  <p className="text-[14px] font-semibold text-foreground mb-1">Curriculum coming soon</p>
                  <p className="text-[13px] text-muted-foreground">
                    Module details are being prepared. Enroll now to get notified.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((module, i) => (
                    <ModuleRow key={module.id} module={module} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: sticky price card */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 bg-card border border-border rounded-2xl shadow-elevated p-6">
              <div className="text-center mb-5">
                <p className="text-[2rem] font-black text-foreground">{fmt(course.price)}</p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">One-time payment · Lifetime access</p>
              </div>

              <div className="space-y-3 mb-5">
                <CourseEnrollCTA courseId={course.id} price={course.price} />
              </div>

              {/* Course stats */}
              {(totalLessons > 0 || totalMinutes > 0 || modules.length > 0) && (
                <div className="border border-border rounded-xl p-4 mb-5 space-y-2.5">
                  {modules.length > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">Modules</span>
                      <span className="font-semibold text-foreground">{modules.length}</span>
                    </div>
                  )}
                  {totalLessons > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-semibold text-foreground">{totalLessons}</span>
                    </div>
                  )}
                  {totalMinutes > 0 && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">Total duration</span>
                      <span className="font-semibold text-foreground">{fmtDuration(totalMinutes)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Includes */}
              <div className="border-t border-border pt-4">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                  This course includes
                </p>
                <ul className="space-y-2.5">
                  {[
                    { Icon: Video, label: "Video lessons" },
                    { Icon: Download, label: "Downloadable resources" },
                    { Icon: MessageSquare, label: "Community Discord access" },
                    { Icon: Award, label: "Verified certificate" },
                    { Icon: Infinity, label: "Lifetime access" },
                  ].map(({ Icon, label }) => (
                    <li key={label} className="flex items-center gap-2.5 text-[13px] text-foreground">
                      <Icon className="w-4 h-4 text-brand shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-center text-[11.5px] text-muted-foreground mt-4">
                30-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20 shadow-elevated">
        <CourseEnrollCTA courseId={course.id} price={course.price} />
      </div>

      <div className="lg:hidden h-24" />

      <FooterSection />
    </div>
  );
}
