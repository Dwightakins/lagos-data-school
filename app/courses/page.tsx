import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";

export const metadata: Metadata = {
  title: "Courses — Lagos Data School",
  description:
    "Browse practical, project-based courses in data analysis, machine learning, software engineering and more.",
};

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

/* ─── Components ───────────────────────────────────────────────────────────── */
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

function CourseCard({ course }: { course: Course }) {
  const emoji = slugEmoji(course.slug);
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:shadow-md hover:border-[#1A56DB]/30 transition-all p-6 flex flex-col"
    >
      <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-4 shrink-0">
        <span className="text-2xl leading-none">{emoji}</span>
      </div>
      <h3 className="text-[16px] font-bold text-[#1F1F1F] mb-2 group-hover:text-[#1A56DB] transition-colors leading-snug">
        {course.title}
      </h3>
      <p className="text-[13.5px] text-[#6B7280] leading-relaxed flex-1 line-clamp-3 mb-4">
        {course.description}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6]">
        <span className="text-[15px] font-bold text-[#1A56DB]">{fmt(course.price)}</span>
        <span className="text-[13px] font-semibold text-[#6B7280] group-hover:text-[#1A56DB] transition-colors flex items-center gap-1">
          View Course
          <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
        </span>
      </div>
    </Link>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, title, slug, description, price, cover_image_url, is_published, created_at, updated_at"
    )
    .eq("is_published", true)
    .order("price");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <SiteNav />

      {/* Hero */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <span className="inline-block bg-[#EFF6FF] text-[#1A56DB] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-5">
            Our Courses
          </span>
          <h1 className="text-[2.4rem] font-black text-[#132128] leading-tight mb-4">
            Build In-Demand Skills
          </h1>
          <p className="text-[16px] text-[#6B7280] max-w-lg mx-auto leading-relaxed">
            Practical, project-based courses in data and technology. Taught by industry experts.
            Earn a verified certificate on completion.
          </p>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {!courses || courses.length === 0 ? (
          <div className="text-center py-28">
            <div className="text-6xl mb-5">📚</div>
            <h2 className="text-[20px] font-bold text-[#1F1F1F] mb-2">
              No courses available yet
            </h2>
            <p className="text-[14px] text-[#6B7280] mb-6">
              New courses are coming soon — check back shortly.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#1A56DB] hover:bg-[#1547BA] text-white font-semibold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[13.5px] text-[#6B7280] mb-6">
              {courses.length} course{courses.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course as Course} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* CTA Banner */}
      <div className="bg-gradient-to-br from-[#132128] to-[#1A56DB] mt-16 py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-[1.9rem] font-black text-white mb-3 leading-tight">
            Ready to start your journey?
          </h2>
          <p className="text-[#93C5FD] text-[15px] mb-8 leading-relaxed">
            Join 2,400+ students building careers in data and technology across Africa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#132128] font-bold text-[15px] px-8 py-3.5 rounded-xl transition-all shadow-xl hover:shadow-2xl"
            >
              Enroll Now
            </Link>
            <Link
              href="/register?type=scholarship"
              className="w-full sm:w-auto border-2 border-white/30 hover:border-white/60 text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl transition-all"
            >
              Apply for Scholarship
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
