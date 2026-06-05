"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart2, Cpu, Code2, Wrench, Terminal, Database, BookOpen,
  TrendingUp, Clock, ChevronDown, ChevronRight, GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function getCourseIcon(slug: string | null | undefined): React.ElementType {
  const s = slug ?? "";
  if (s.includes("data-anal") || s.includes("analytics")) return BarChart2;
  if (s.includes("machine") || s.includes("ml") || s.includes("ai")) return Cpu;
  if (s.includes("software") || s.includes("web") || s.includes("dev")) return Code2;
  if (s.includes("data-eng") || s.includes("pipeline")) return Wrench;
  if (s.includes("python")) return Terminal;
  if (s.includes("sql") || s.includes("database")) return Database;
  if (s.includes("power-bi") || s.includes("tableau") || s.includes("viz")) return TrendingUp;
  return BookOpen;
}

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number | null;
}
interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}
interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  duration?: string;
  cover_image_url?: string;
}

interface Props {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className ?? ""}`} />;
}

function ModuleRow({ mod }: { mod: Module }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <span className="font-semibold text-foreground text-[13.5px]">{mod.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">
            {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && mod.lessons.length > 0 && (
        <ul className="divide-y divide-border">
          {mod.lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-center justify-between px-4 py-2.5 bg-background">
              <span className="text-[13px] text-foreground/80">{lesson.title}</span>
              {lesson.duration_minutes && (
                <span className="text-[11px] text-muted-foreground font-medium shrink-0 ml-3">
                  {lesson.duration_minutes} min
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CourseDetailModal({ courseId, open, onClose }: Props) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!open || !courseId) return;
    setLoading(true);
    setCourse(null);
    setModules([]);

    const supabase = createClient();
    Promise.all([
      fetch(`/api/courses/${courseId}`).then((r) => r.json()) as Promise<{ course: CourseDetail; modules: Module[] }>,
      supabase.auth.getUser(),
    ])
      .then(([data, { data: { user } }]) => {
        if (data.course) setCourse(data.course);
        if (data.modules) setModules(data.modules);
        setLoggedIn(!!user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, courseId]);

  const enrollHref = courseId
    ? loggedIn
      ? `/checkout?courseId=${courseId}`
      : `/register?course=${courseId}`
    : "/register";

  const Icon = course ? getCourseIcon(course.slug) : BookOpen;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header gradient */}
        <div className="gradient-brand h-32 flex items-center justify-center relative">
          <Icon className="w-16 h-16 text-white/20 absolute" />
          <div className="relative z-10 text-center">
            <GraduationCap className="w-8 h-8 text-brand-foreground mx-auto opacity-80" />
          </div>
        </div>

        <div className="px-6 py-6">
          <DialogHeader className="mb-4">
            {loading || !course ? (
              <>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </>
            ) : (
              <>
                <DialogTitle className="text-[1.35rem] font-bold text-foreground leading-tight">
                  {course.title}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {course.duration && (
                    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {course.duration}
                    </span>
                  )}
                  <span className="text-[1.15rem] font-black text-brand">
                    {fmt(course.price)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">or ₦8,000 scholarship fee</span>
                </div>
              </>
            )}
          </DialogHeader>

          {/* Description */}
          {loading ? (
            <div className="space-y-1.5 mb-6">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </div>
          ) : course ? (
            <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-6">
              {course.description}
            </p>
          ) : null}

          {/* Course outline */}
          {loading ? (
            <div className="space-y-2 mb-6">
              <Skeleton className="h-4 w-32 mb-3" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : modules.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide mb-3">
                Course Outline — {modules.length} modules
              </h3>
              <div className="space-y-2">
                {modules.map((mod) => (
                  <ModuleRow key={mod.id} mod={mod} />
                ))}
              </div>
            </div>
          ) : null}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border mt-2">
            <Link
              href={enrollHref}
              onClick={onClose}
              className="flex-1 gradient-brand text-brand-foreground font-bold text-[14.5px] py-3.5 rounded-xl text-center hover:opacity-90 transition-opacity shadow-sm"
            >
              {loading || !course
                ? "Enroll Now"
                : `Enroll Now — ${fmt(course.price)}`}
            </Link>
            {course && (
              <Link
                href={`/courses/${course.id}`}
                onClick={onClose}
                className="flex-1 border-2 border-border text-foreground font-semibold text-[14px] py-3.5 rounded-xl text-center hover:border-brand hover:text-brand transition-colors"
              >
                View Full Course →
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
