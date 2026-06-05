import Link from "next/link";
import Image from "next/image";
import type { EnrolledCourse } from "@/types";

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

function CourseProgressCard({ course }: { course: EnrolledCourse }) {
  const gradient = GRADIENTS[course.courseId.charCodeAt(0) % GRADIENTS.length];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all group">
      {/* Thumbnail */}
      {course.coverImage ? (
        <div className="relative h-36 overflow-hidden">
          <Image
            src={course.coverImage}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <span className="text-white font-black text-[13px] tracking-wider opacity-80 relative">LAGOS DATA SCHOOL</span>
        </div>
      )}

      <div className="p-5">
        <h3 className="font-bold text-[15px] text-[#0f172a] mb-1 leading-snug line-clamp-2">{course.title}</h3>
        <p className="text-[11.5px] text-slate-400 mb-4">Enrolled {formatDate(course.enrolledAt)}</p>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11.5px] text-slate-500 font-medium">
              {course.completedLessons} / {course.totalLessons || "—"} lessons
            </span>
            <span className="text-[11.5px] font-bold text-[#1A56DB]">{course.progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1A56DB] to-[#3b82f6] rounded-full transition-all duration-700"
              style={{ width: `${Math.max(course.progressPercent, course.progressPercent > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>

        <Link
          href={`/dashboard/courses/${course.courseId}`}
          className="w-full flex items-center justify-center gap-2 bg-[#1A56DB] hover:bg-[#1547BA] text-white font-semibold text-[13.5px] py-2.5 rounded-xl transition-all hover:shadow-md hover:shadow-[#1A56DB]/25"
        >
          {course.progressPercent > 0 ? "Continue Learning →" : "Start Course →"}
        </Link>
      </div>
    </div>
  );
}

interface MyCoursesProps {
  courses: EnrolledCourse[];
}

export default function MyCourses({ courses }: MyCoursesProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[1.15rem] font-bold text-[#0f172a]">Continue Learning</h2>
        {courses.length > 0 && (
          <Link href="/dashboard/courses" className="text-[13px] text-[#1A56DB] font-semibold hover:underline">
            View all →
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-14 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
            <span className="text-4xl leading-none">📖</span>
          </div>
          <h3 className="text-[16px] font-semibold text-[#0f172a] mb-2">You haven&apos;t enrolled in any courses yet</h3>
          <p className="text-[13.5px] text-slate-500 mb-6 max-w-xs leading-relaxed">
            Browse our courses and start your tech career today
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-[#1A56DB] hover:bg-[#1547BA] text-white font-semibold text-[14px] px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-[#1A56DB]/20"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {courses.map((course) => (
            <CourseProgressCard key={course.enrollmentId} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
