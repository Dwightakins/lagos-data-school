import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Course, Module } from "@/types";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function slugEmoji(slug: string): string {
  if (slug.includes("data-anal") || slug.includes("analytics")) return "📊";
  if (slug.includes("machine") || slug.includes("ml") || slug.includes("ai")) return "🤖";
  if (slug.includes("software") || slug.includes("web") || slug.includes("dev")) return "💻";
  if (slug.includes("data-eng") || slug.includes("pipeline")) return "🔧";
  if (slug.includes("python")) return "🐍";
  if (slug.includes("sql") || slug.includes("database")) return "🗄️";
  if (slug.includes("power-bi") || slug.includes("tableau") || slug.includes("viz")) return "📈";
  return "📚";
}

/* ─── Metadata ─────────────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("title, description")
    .eq("id", params.id)
    .single();

  if (!data) return { title: "Course — Lagos Data School" };
  return {
    title: `${data.title} — Lagos Data School`,
    description: data.description as string,
  };
}

/* ─── Shared nav ───────────────────────────────────────────────────────────── */
function SiteNav() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E5E7EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#2b373d] flex items-center justify-center shadow-sm">
            <span className="font-black text-white text-[11px] tracking-tight">LDS</span>
          </div>
          <span className="font-bold text-[14px] text-[#132128] hidden sm:block">
            Lagos Data School
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13.5px] font-semibold text-[#374151] hover:text-[#1A56DB] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[13.5px] px-4 py-2 rounded-lg transition-colors shadow-sm shadow-[#16A34A]/20"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Module accordion row ─────────────────────────────────────────────────── */
function ModuleRow({
  module,
  index,
}: {
  module: Module;
  index: number;
}) {
  return (
    <div className="border border-[#E5E7EB] rounded-xl p-4 bg-white">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[12px] font-bold text-[#1A56DB]">{index + 1}</span>
        </div>
        <div className="min-w-0">
          <h4 className="text-[14px] font-semibold text-[#1F1F1F] leading-snug">{module.title}</h4>
          {module.description && (
            <p className="text-[13px] text-[#6B7280] mt-1 leading-relaxed">{module.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const [courseResult, modulesResult] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, title, slug, description, price, cover_image_url, is_published, created_at, updated_at"
      )
      .eq("id", params.id)
      .single(),
    supabase
      .from("modules")
      .select("id, course_id, title, description, order_index, created_at")
      .eq("course_id", params.id)
      .order("order_index"),
  ]);

  if (courseResult.error || !courseResult.data || !courseResult.data.is_published) {
    notFound();
  }

  const course = courseResult.data as Course;
  const modules = (modulesResult.data ?? []) as Module[];
  const emoji = slugEmoji(course.slug);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteNav />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-[13px] text-[#6B7280]">
            <Link href="/" className="hover:text-[#1A56DB] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/courses" className="hover:text-[#1A56DB] transition-colors">
              Courses
            </Link>
            <span>/</span>
            <span className="text-[#1F1F1F] font-medium truncate">{course.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#132128] to-[#1a2d38] border-b border-[#0a1a22]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="max-w-2xl">
            <span className="text-4xl mb-4 block">{emoji}</span>
            <h1 className="text-[2rem] sm:text-[2.4rem] font-black text-white leading-tight mb-4">
              {course.title}
            </h1>
            <p className="text-[15px] text-[#93C5FD] leading-relaxed mb-6">
              {course.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#64748B]">
              <span className="bg-white/10 text-white px-3 py-1 rounded-full font-semibold text-[12px]">
                {modules.length} {modules.length === 1 ? "Module" : "Modules"}
              </span>
              <span className="bg-white/10 text-white px-3 py-1 rounded-full font-semibold text-[12px]">
                Verified Certificate
              </span>
              <span className="bg-white/10 text-white px-3 py-1 rounded-full font-semibold text-[12px]">
                Project-Based
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content + sidebar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left: modules list ── */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[1.2rem] font-bold text-[#1F1F1F] mb-4">
              Course Curriculum
            </h2>

            {modules.length === 0 ? (
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center">
                <span className="text-4xl block mb-3">🛠️</span>
                <p className="text-[14px] font-semibold text-[#374151] mb-1">
                  Curriculum coming soon
                </p>
                <p className="text-[13px] text-[#6B7280]">
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

            {/* What you'll learn */}
            <div className="mt-10 bg-white border border-[#E5E7EB] rounded-2xl p-6">
              <h3 className="text-[1rem] font-bold text-[#1F1F1F] mb-4">
                What you&apos;ll learn
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {[
                  "Real-world, hands-on projects",
                  "Industry-standard tools & workflows",
                  "Peer learning and community support",
                  "Weekly live sessions with mentors",
                  "Job-ready portfolio by end of course",
                  "Verified digital certificate",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[13px] text-[#374151]"
                  >
                    <span className="text-[#16A34A] mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Right: sticky price card ── */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6">
              <div className="text-center mb-5">
                <p className="text-[2rem] font-black text-[#1A56DB]">{fmt(course.price)}</p>
                <p className="text-[12.5px] text-[#6B7280] mt-0.5">One-time payment · Lifetime access</p>
              </div>

              <div className="space-y-3 mb-5">
                <Link
                  href={`/register?course=${course.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[15px] py-3 rounded-xl transition-colors shadow-sm shadow-[#16A34A]/20"
                >
                  Enroll Now
                </Link>
                <Link
                  href={`/register?course=${course.id}&type=scholarship`}
                  className="w-full flex items-center justify-center gap-2 border-2 border-[#1A56DB] text-[#1A56DB] hover:bg-[#EFF6FF] font-semibold text-[14px] py-2.5 rounded-xl transition-colors"
                >
                  Apply for Scholarship
                </Link>
              </div>

              {/* Includes */}
              <div className="border-t border-[#F3F4F6] pt-4">
                <p className="text-[12px] font-semibold text-[#374151] uppercase tracking-wide mb-3">
                  This course includes
                </p>
                <ul className="space-y-2.5">
                  {[
                    { icon: "🎥", label: "Video lessons" },
                    { icon: "📁", label: "Downloadable resources" },
                    { icon: "💬", label: "Community Discord access" },
                    { icon: "🏆", label: "Verified certificate" },
                    { icon: "♾️", label: "Lifetime access" },
                  ].map(({ icon, label }) => (
                    <li key={label} className="flex items-center gap-2.5 text-[13px] text-[#374151]">
                      <span className="leading-none">{icon}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-center text-[11.5px] text-[#9CA3AF] mt-4">
                30-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA (visible only on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] p-4 flex gap-3 z-20">
        <Link
          href={`/register?course=${course.id}&type=scholarship`}
          className="flex-1 flex items-center justify-center border-2 border-[#1A56DB] text-[#1A56DB] font-semibold text-[14px] py-2.5 rounded-xl transition-colors"
        >
          Scholarship
        </Link>
        <Link
          href={`/register?course=${course.id}`}
          className="flex-1 flex items-center justify-center bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[14px] py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Enroll — {fmt(course.price)}
        </Link>
      </div>

      {/* Spacer for mobile CTA */}
      <div className="lg:hidden h-24" />
    </div>
  );
}
