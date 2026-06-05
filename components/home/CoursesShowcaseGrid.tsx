"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart2, Cpu, Code2, Wrench, Terminal, Database,
  BookOpen, TrendingUp, Clock, ArrowRight,
} from "lucide-react";
import { CourseDetailModal } from "@/components/courses/CourseDetailModal";

interface CourseSummary {
  id: string;
  title: string;
  slug: string | null;
  description: string;
  price: number;
  duration?: string;
}

function getCourseStyle(slug: string | null | undefined): { gradient: string; Icon: React.ElementType } {
  const s = slug ?? "";
  if (s.includes("data-anal") || s.includes("analytics"))
    return { gradient: "from-emerald-600 to-teal-800", Icon: BarChart2 };
  if (s.includes("machine") || s.includes("ml") || s.includes("ai"))
    return { gradient: "from-teal-600 to-cyan-800", Icon: Cpu };
  if (s.includes("software") || s.includes("web") || s.includes("dev"))
    return { gradient: "from-brand to-brand-glow", Icon: Code2 };
  if (s.includes("data-eng") || s.includes("pipeline"))
    return { gradient: "from-teal-700 to-emerald-900", Icon: Wrench };
  if (s.includes("python"))
    return { gradient: "from-emerald-500 to-teal-700", Icon: Terminal };
  if (s.includes("sql") || s.includes("database"))
    return { gradient: "from-cyan-600 to-teal-700", Icon: Database };
  if (s.includes("power-bi") || s.includes("tableau") || s.includes("viz"))
    return { gradient: "from-teal-500 to-emerald-700", Icon: TrendingUp };
  return { gradient: "from-brand to-brand-glow", Icon: BookOpen };
}

function CourseCard({
  course,
  onClick,
}: {
  course: CourseSummary;
  onClick: () => void;
}) {
  const { gradient, Icon } = getCourseStyle(course.slug);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-card border border-border rounded-2xl overflow-hidden hover:border-brand/40 hover:shadow-lg transition-all duration-200"
    >
      {/* Gradient header */}
      <div className={`relative h-28 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        <Icon className="w-14 h-14 text-white/15 absolute right-4 top-1/2 -translate-y-1/2 transition-transform group-hover:scale-110 duration-300" />
        <div className="relative z-10 px-5 pb-1 w-full">
          <p className="text-[10px] text-white/60 font-semibold uppercase tracking-widest mb-0.5">Per course</p>
          <p className="text-[1.3rem] font-black text-white">
            ₦{course.price.toLocaleString("en-NG")}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-foreground text-[15px] mb-1.5 leading-snug group-hover:text-brand transition-colors">
          {course.title}
        </h3>
        {course.duration && (
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-3">
            <Clock className="w-3.5 h-3.5" />
            {course.duration}
          </div>
        )}
        <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {course.description}
        </p>
        <span className="inline-flex items-center gap-1 text-brand text-[13px] font-bold group-hover:gap-2 transition-all">
          Learn More <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}

export function CoursesShowcaseGrid({ courses }: { courses: CourseSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => setSelectedId(course.id)}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-bold text-[14.5px] px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
        >
          Browse All Courses <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/apply-scholarship"
          className="inline-flex items-center gap-2 border-2 border-brand text-brand font-bold text-[14.5px] px-8 py-3.5 rounded-xl hover:bg-brand hover:text-brand-foreground transition-all"
        >
          Apply for Scholarship
        </Link>
      </div>

      <CourseDetailModal
        courseId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
