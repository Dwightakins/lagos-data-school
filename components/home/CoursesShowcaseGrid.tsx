"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { CourseDetailModal } from "@/components/courses/CourseDetailModal";
import { CourseCard, type CourseCardData } from "@/components/courses/CourseCard";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";

export function CoursesShowcaseGrid({ courses }: { courses: CourseCardData[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const enrollment = useEnrollmentStatus();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onOpen={() => setSelectedId(course.id)}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
        {enrollment === "enrolled" ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[14.5px] px-8 py-3.5 rounded-xl transition-colors shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[14.5px] px-8 py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Browse All Courses <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/apply-scholarship"
              className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 dark:text-green-500 font-bold text-[14.5px] px-8 py-3.5 rounded-xl hover:bg-green-600 hover:text-white transition-all"
            >
              Apply for Scholarship
            </Link>
          </>
        )}
      </div>

      <CourseDetailModal
        courseId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
