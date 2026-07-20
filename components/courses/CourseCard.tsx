"use client";

import Link from "next/link";
import {
  ArrowRight, BarChart3, BookOpen, Brain, Clock, Cloud, Code2, Cpu,
  Database, GitBranch, Kanban, LayoutDashboard, Link as LinkIcon,
  Megaphone, Palette, Shield, Smartphone, Terminal,
} from "lucide-react";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";

export type CourseCategory = "Data & AI" | "Development" | "Security" | "Business" | "Design";

export const COURSE_FILTERS = ["All", "Data & AI", "Development", "Security", "Business", "Design"] as const;
export type CourseFilter = (typeof COURSE_FILTERS)[number];

export interface CourseCardData {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  duration?: string | null;
}

interface CourseMeta {
  Icon: React.ElementType;
  category: CourseCategory;
}

export function getCourseMeta(slug: string | null | undefined, title?: string | null): CourseMeta {
  const s = `${slug ?? ""} ${title ?? ""}`.toLowerCase();
  const words = s.replace(/[-_/]/g, " ");

  if (s.includes("cyber") || s.includes("security")) return { Icon: Shield, category: "Security" };
  if (s.includes("ui") && s.includes("ux")) return { Icon: Palette, category: "Design" };
  if (s.includes("design")) return { Icon: Palette, category: "Design" };
  if (s.includes("marketing")) return { Icon: Megaphone, category: "Business" };
  if (s.includes("product")) return { Icon: Kanban, category: "Business" };
  if (s.includes("machine") || /\bml\b/.test(words)) return { Icon: Brain, category: "Data & AI" };
  if (/\bai\b/.test(words) || s.includes("artificial")) return { Icon: Cpu, category: "Data & AI" };
  if (s.includes("data-anal") || s.includes("analytics") || s.includes("data anal"))
    return { Icon: BarChart3, category: "Data & AI" };
  if (s.includes("data-eng") || s.includes("data eng") || s.includes("pipeline"))
    return { Icon: Database, category: "Data & AI" };
  if (s.includes("python")) return { Icon: Terminal, category: "Data & AI" };
  if (s.includes("sql") || s.includes("database")) return { Icon: Database, category: "Data & AI" };
  if (s.includes("cloud")) return { Icon: Cloud, category: "Development" };
  if (s.includes("blockchain")) return { Icon: LinkIcon, category: "Development" };
  if (s.includes("mobile") || s.includes("app dev")) return { Icon: Smartphone, category: "Development" };
  if (s.includes("devops")) return { Icon: GitBranch, category: "Development" };
  if (s.includes("software") || s.includes("web") || s.includes("frontend") || s.includes("backend"))
    return { Icon: Code2, category: "Development" };
  return { Icon: BookOpen, category: "Data & AI" };
}

export function CourseCard({
  course,
  onOpen,
}: {
  course: CourseCardData;
  onOpen: () => void;
}) {
  const { Icon, category } = getCourseMeta(course.slug, course.title);
  const enrollment = useEnrollmentStatus();

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-green-500 hover:shadow-lg dark:border-border dark:bg-card dark:hover:border-green-500">
      {/* Icon + category badge */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-500/10">
          <Icon className="h-6 w-6 text-green-600 dark:text-green-500" />
        </span>
        <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
          {category}
        </span>
      </div>

      {/* Title + description */}
      <button type="button" onClick={onOpen} className="text-left" aria-label={`View ${course.title}`}>
        <h3 className="mb-2 text-[17px] font-bold leading-snug text-gray-900 transition-colors group-hover:text-green-700 dark:text-foreground dark:group-hover:text-green-400">
          {course.title}
        </h3>
      </button>
      {course.description && (
        <p className="mb-4 line-clamp-2 text-[13.5px] leading-relaxed text-gray-500 dark:text-muted-foreground">
          {course.description}
        </p>
      )}

      {/* Duration */}
      {course.duration && (
        <div className="mb-4 flex items-center gap-1.5 text-[12.5px] text-gray-500 dark:text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {course.duration}
        </div>
      )}

      {/* Price + actions — pinned to the bottom so cards align in a grid */}
      <div className="mt-auto">
        <p className="mb-4 text-[20px] font-bold text-gray-900 dark:text-foreground">
          ₦{course.price.toLocaleString("en-NG")}
        </p>
        {enrollment === "enrolled" ? (
          <div className="border-t border-green-600/15 pt-4">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-green-700"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 border-t border-green-600/15 pt-4">
            <button
              type="button"
              onClick={onOpen}
              className="rounded-lg bg-green-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-green-700"
            >
              Enroll Now
            </button>
            <Link
              href="/apply-scholarship"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-green-600 transition-all hover:gap-1.5 dark:text-green-500"
            >
              97% Scholarship <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
