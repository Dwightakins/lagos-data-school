"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart2, Cpu, Code2, Wrench, Terminal, Database,
  BookOpen, TrendingUp, ArrowRight, Users, Award, Clock,
} from "lucide-react";
import { BackgroundLines } from "@/components/ui/background-lines";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CourseDetailModal } from "@/components/courses/CourseDetailModal";
import type { Course } from "@/types";

function getCourseStyle(slug: string | null | undefined): { gradient: string; Icon: React.ElementType } {
  const s = slug ?? "";
  if (s.includes("data-anal") || s.includes("analytics"))
    return { gradient: "from-emerald-600 to-teal-800", Icon: BarChart2 };
  if (s.includes("machine") || s.includes("ml") || s.includes("ai"))
    return { gradient: "from-teal-600 to-cyan-800", Icon: Cpu };
  if (s.includes("software") || s.includes("web") || s.includes("dev"))
    return { gradient: "from-teal-700 to-emerald-900", Icon: Code2 };
  if (s.includes("data-eng") || s.includes("pipeline"))
    return { gradient: "from-emerald-700 to-teal-900", Icon: Wrench };
  if (s.includes("python"))
    return { gradient: "from-emerald-500 to-teal-700", Icon: Terminal };
  if (s.includes("sql") || s.includes("database"))
    return { gradient: "from-cyan-600 to-teal-700", Icon: Database };
  if (s.includes("power-bi") || s.includes("tableau") || s.includes("viz"))
    return { gradient: "from-teal-500 to-emerald-700", Icon: TrendingUp };
  return { gradient: "from-teal-600 to-emerald-800", Icon: BookOpen };
}

function CourseCardHeader({ course, onOpen }: { course: Course; onOpen: () => void }) {
  const { gradient, Icon } = getCourseStyle(course.slug);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left cursor-pointer group"
    >
      <div className={`relative h-36 rounded-xl bg-gradient-to-br ${gradient} flex items-end p-4 overflow-hidden`}>
        <Icon className="w-16 h-16 text-white/15 absolute right-3 top-1/2 -translate-y-1/2 transition-transform group-hover:scale-110 duration-300" />
        <div className="relative z-10">
          <div className="text-[11px] text-white/60 font-medium">Per course</div>
          <div className="text-[1.2rem] font-black text-white">
            ₦{course.price.toLocaleString("en-NG")}
          </div>
          {course.duration && (
            <div className="flex items-center gap-1 text-[10px] text-white/70 mt-0.5">
              <Clock className="w-3 h-3" />
              {course.duration}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function CourseItemContent({ course, onOpen }: { course: Course; onOpen: () => void }) {
  return (
    <div className="relative">
      <GlowingEffect
        spread={25}
        glow={false}
        disabled={false}
        proximity={50}
        inactiveZone={0.1}
        borderWidth={2}
      />
      <p className="text-muted-foreground text-[13px] leading-relaxed mb-3 line-clamp-2">
        {course.description?.slice(0, 80) ?? ""}…
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1 text-brand font-bold text-[13px] hover:gap-2 transition-all"
      >
        View Course <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function LDSCoursesClient({ courses }: { courses: Course[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
            <Link href="/" className="inline-flex items-center gap-2 gradient-brand text-brand-foreground font-bold text-[14px] px-6 py-2.5 rounded-xl">
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[13.5px] text-muted-foreground mb-6 font-medium">
              {courses.length} course{courses.length !== 1 ? "s" : ""} available
            </p>
            <BentoGrid className="md:auto-rows-[22rem] gap-5">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  data-mobile-motion-visible="true"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className={i === 0 || i === 3 ? "md:col-span-2" : ""}
                >
                  <BentoGridItem
                    className="border-border bg-card hover:border-brand/30 h-full"
                    header={<CourseCardHeader course={course} onOpen={() => setSelectedId(course.id)} />}
                    icon={null}
                    title={<span className="font-bold text-foreground text-[15px]">{course.title}</span>}
                    description={<CourseItemContent course={course} onOpen={() => setSelectedId(course.id)} />}
                  />
                </motion.div>
              ))}
            </BentoGrid>
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
          <Link
            href="/register"
            className="inline-flex items-center gap-2 gradient-brand text-brand-foreground font-bold text-[15px] px-10 py-4 rounded-xl transition-opacity hover:opacity-90 shadow-lg"
          >
            Enroll Now →
          </Link>
          <Link
            href="/apply-scholarship"
            className="inline-flex items-center gap-2 border-2 border-brand text-brand font-bold text-[15px] px-10 py-4 rounded-xl hover:bg-brand hover:text-brand-foreground transition-all"
          >
            Apply for Scholarship
          </Link>
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
