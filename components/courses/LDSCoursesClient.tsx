"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Award, BookOpen, Clock, LayoutDashboard, Users } from "lucide-react";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";
import { BackgroundLines } from "@/components/ui/background-lines";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { CourseDetailModal } from "@/components/courses/CourseDetailModal";
import {
  COURSE_FILTERS,
  CourseCard,
  getCourseMeta,
  type CourseFilter,
} from "@/components/courses/CourseCard";
import type { Course } from "@/types";

export default function LDSCoursesClient({ courses }: { courses: Course[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CourseFilter>("All");
  const enrollment = useEnrollmentStatus();

  const filtered = useMemo(
    () =>
      filter === "All"
        ? courses
        : courses.filter((c) => getCourseMeta(c.slug, c.title).category === filter),
    [courses, filter],
  );

  return (
    <>
      {/* Hero */}
      <BackgroundLines className="bg-background min-h-[340px] flex items-center">
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-16 text-center">
          <span className="text-[11.5px] font-bold text-brand uppercase tracking-[0.28em] mb-4 block">
            Our Curriculum
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[2rem] sm:text-[2.75rem] font-bold text-foreground leading-[1.1]">
            <span>Browse Our</span>
            <ContainerTextFlip
              words={["Data", "Engineering", "AI", "Python", "SQL"]}
              className="text-[1.8rem] sm:text-[2.4rem] gradient-brand shadow-none"
              textClassName="text-brand-foreground"
              interval={2500}
            />
            <span>Courses</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { icon: Users, label: "2,400+ Students" },
              { icon: Award, label: "Verified Certificates" },
              { icon: Clock, label: "Lifetime Access" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
                <Icon className="w-4 h-4 text-brand" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </BackgroundLines>

      {/* Course Grid */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        {courses.length === 0 ? (
          <div className="text-center py-28">
            <BookOpen className="w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-[20px] font-bold text-foreground mb-2">No courses available yet</h2>
            <p className="text-[14px] text-muted-foreground mb-6">New courses are coming soon — check back shortly.</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[14px] px-6 py-2.5 rounded-xl transition-colors">
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            {/* Filter tabs */}
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {COURSE_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={
                    f === filter
                      ? "rounded-full bg-green-600 px-4 py-1.5 text-[13px] font-semibold text-white transition-colors"
                      : "rounded-full border border-gray-200 dark:border-border px-4 py-1.5 text-[13px] font-medium text-gray-500 dark:text-muted-foreground transition-colors hover:text-foreground hover:border-green-600/40"
                  }
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-[13px] text-muted-foreground font-medium">
                {filtered.length} course{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[14.5px] text-muted-foreground">
                  No courses in this category yet — try another filter.
                </p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filtered.map((course) => (
                    <motion.div
                      key={course.id}
                      layout
                      data-mobile-motion-visible="true"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <CourseCard course={course} onOpen={() => setSelectedId(course.id)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* CTA */}
      <div className="bg-foreground py-20 text-center px-6">
        <h2 className="text-[2rem] font-bold text-background mb-3">Ready to enroll?</h2>
        <p className="text-background/60 text-[15px] mb-8 max-w-md mx-auto">
          Join 2,400+ students building careers in data and technology.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {enrollment === "enrolled" ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[15px] px-10 py-4 rounded-xl transition-colors shadow-lg"
            >
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[15px] px-10 py-4 rounded-xl transition-colors shadow-lg"
              >
                Enroll Now →
              </Link>
              <Link
                href="/apply-scholarship"
                className="inline-flex items-center gap-2 border-2 border-green-600 text-green-600 dark:text-green-500 font-bold text-[15px] px-10 py-4 rounded-xl hover:bg-green-600 hover:text-white transition-all"
              >
                Apply for Scholarship
              </Link>
            </>
          )}
        </div>
      </div>

      <CourseDetailModal
        courseId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
