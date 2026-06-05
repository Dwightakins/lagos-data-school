import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  BarChart2, Cpu, Code2, Wrench, Terminal, Database, BookOpen, TrendingUp
} from "lucide-react";

function getCourseStyle(slug: string | null): { gradient: string; Icon: React.ElementType } {
  if (!slug) return { gradient: "from-[#e63946] to-[#c1121f]", Icon: BarChart2 };
  if (slug.includes("data-anal") || slug.includes("analytics"))
    return { gradient: "from-[#722F37] to-[#0A0A0A]", Icon: BarChart2 };
  if (slug.includes("machine") || slug.includes("ml") || slug.includes("ai"))
    return { gradient: "from-[#722F37] to-[#0A0A0A]", Icon: Cpu };
  if (slug.includes("software") || slug.includes("web") || slug.includes("dev"))
    return { gradient: "from-[#0A0A0A] to-[#722F37]", Icon: Code2 };
  if (slug.includes("data-eng") || slug.includes("pipeline"))
    return { gradient: "from-[#722F37] to-[#0A0A0A]", Icon: Wrench };
  if (slug.includes("python"))
    return { gradient: "from-[#0A0A0A] to-[#722F37]", Icon: Terminal };
  if (slug.includes("sql") || slug.includes("database"))
    return { gradient: "from-[#722F37] to-[#0A0A0A]", Icon: Database };
  if (slug.includes("power-bi") || slug.includes("tableau") || slug.includes("viz"))
    return { gradient: "from-[#0A0A0A] to-[#722F37]", Icon: TrendingUp };
  return { gradient: "from-[#0A0A0A] to-[#722F37]", Icon: BookOpen };
}

function CourseHeader({ course }: { course: Course }) {
  const { gradient, Icon } = getCourseStyle(course.slug);
  return (
    <div className={`relative h-32 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
      <Icon className="w-12 h-12 text-white/30 absolute right-4 bottom-2" />
      <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
        <span className="text-[12px] font-black text-white">₦250,000</span>
      </div>
      <div className="absolute bottom-3 left-4">
        <span className="text-[11px] text-white/60 font-medium">Per course</span>
      </div>
    </div>
  );
}

export default async function LDSCoursesSection() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, description, price")
    .eq("published", true)
    .order("created_at", { ascending: true })
    .limit(6);

  if (!courses || courses.length === 0) return null;

  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <span className="text-[11.5px] font-bold text-[#722F37] uppercase tracking-[0.28em] mb-3 block">
            Our Curriculum
          </span>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#FFFFFF] leading-[1.1] tracking-[-0.025em]">
            Our Most Popular Courses
          </h2>
          <p className="text-[16px] text-[#FFFFFF]/60 mt-4 max-w-lg mx-auto leading-relaxed">
            Start with any course. Master the skill. Get hired.
          </p>
        </div>

        <BentoGrid className="max-w-7xl mx-auto gap-5 md:auto-rows-[20rem]">
          {(courses as Course[]).map((course, i) => (
            <BentoGridItem
              key={course.id}
              className={[
                "border-[#722F37]/20 bg-[#FFFFFF] hover:border-[#722F37]/50",
                i === 0 ? "md:col-span-2" : "",
                i === 3 ? "md:col-span-2" : "",
              ].join(" ")}
              header={<CourseHeader course={course} />}
              icon={null}
              title={
                <span className="text-[#FFFFFF] font-bold text-[15px]">{course.title}</span>
              }
              description={
                <span className="text-[#FFFFFF]/60">
                  {course.description?.slice(0, 80)}...
                  <Link href="/register" className="ml-2 font-bold text-[#722F37] hover:underline">
                    Enroll Now →
                  </Link>
                </span>
              }
            />
          ))}
        </BentoGrid>

        <div className="text-center mt-10">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 border-2 border-[#FFFFFF] text-[#FFFFFF] font-bold text-[14px] px-8 py-3 rounded-xl hover:bg-[#722F37] hover:border-[#722F37] transition-all"
          >
            View All Courses →
          </Link>
        </div>
      </div>
    </section>
  );
}
