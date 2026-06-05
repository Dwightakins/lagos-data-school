"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CourseItem } from "@/components/auth/types";
import { BarChart2, Cpu, Code2, Wrench, Terminal, Database, BookOpen } from "lucide-react";
import type { LucideIcon } from "@/components/auth/types";

interface CourseFetch {
  id: string;
  title: string;
  description: string;
  price: number;
  duration?: string;
}

function getCourseIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("data anal") || t.includes("analytics")) return BarChart2;
  if (t.includes("machine learn") || t.includes("neural") || t.includes(" ml")) return Cpu;
  if (t.includes("software") || t.includes("full-stack") || t.includes("web dev")) return Code2;
  if (t.includes("data eng") || t.includes("pipeline")) return Wrench;
  if (t.includes("python")) return Terminal;
  if (t.includes("sql") || t.includes("database")) return Database;
  return BookOpen;
}

interface Step2Props {
  onContinue: (course: CourseItem, finalPrice: number) => void;
  onBack: () => void;
}

export default function Step2Course({ onContinue, onBack }: Step2Props) {
  const [courses, setCourses] = useState<CourseFetch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data: { courses?: CourseFetch[] } | CourseFetch[]) => {
        const list = Array.isArray(data) ? data : (data as { courses?: CourseFetch[] }).courses ?? [];
        if (list.length === 0) { setError("No courses found."); return; }
        setCourses(list);
      })
      .catch(() => setError("Connection failed. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const selected = courses.find((c) => c.id === selectedId) ?? null;

  function handleContinue() {
    if (!selected) return;
    const item: CourseItem = {
      id: selected.id,
      name: selected.title,
      icon: getCourseIcon(selected.title),
      desc: selected.description,
      price: selected.price,
    };
    onContinue(item, selected.price);
  }

  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border-2 border-border p-3 flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-3/4 mb-1.5" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-3.5 w-20 flex-shrink-0" />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="text-center py-10">
      <p className="text-destructive mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="gradient-brand text-brand-foreground px-6 py-2 rounded-lg font-semibold"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div>
      <h2 className="text-[1.4rem] font-bold text-foreground mb-1">Choose your course</h2>
      <p className="text-[13.5px] text-foreground/60 mb-4">
        Select the programme you want to enroll in.
      </p>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {courses.map((course) => {
          const isSelected = course.id === selectedId;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => setSelectedId(course.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? "border-brand bg-brand/5"
                  : "border-border hover:border-brand/40 bg-background"
              }`}
            >
              {/* Radio dot */}
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                isSelected ? "border-brand" : "border-muted-foreground/30"
              }`}>
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{course.title}</p>
                <p className="text-muted-foreground text-xs truncate">{course.description}</p>
                {course.duration && (
                  <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {course.duration}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <p className="text-foreground font-bold text-sm">₦{course.price.toLocaleString("en-NG")}</p>
                <p className="text-[10.5px] text-brand font-semibold">or ₦10K scholarship</p>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 p-4 bg-foreground rounded-xl text-brand-foreground">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm opacity-80">Selected</span>
            <p className="text-xl font-bold text-brand">
              ₦{selected.price.toLocaleString("en-NG")}
            </p>
          </div>
          <p className="text-sm font-semibold mt-1 opacity-90">{selected.title}</p>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-lg border border-border text-[14px] font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected}
          className="flex-1 gradient-brand hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-brand-foreground font-semibold text-[14.5px] py-2.5 rounded-lg transition-opacity shadow-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
