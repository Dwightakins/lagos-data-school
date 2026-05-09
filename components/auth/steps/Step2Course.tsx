"use client";

import { useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CourseItem } from "@/components/auth/types";

function courseEmoji(title: string, slug: string) {
  const s = (title + " " + slug).toLowerCase();
  if (s.includes("data anal") || s.includes("data-anal") || s.includes("analytics")) return "📊";
  if (s.includes("machine learn") || s.includes("machine-learn") || s.includes(" ml") || s.includes("neural")) return "🤖";
  if (s.includes("software") || s.includes("full-stack") || s.includes("fullstack") || s.includes("web dev")) return "💻";
  if (s.includes("data eng") || s.includes("data-eng") || s.includes("pipeline")) return "🔧";
  if (s.includes("python")) return "🐍";
  if (s.includes("sql") || s.includes("database")) return "🗄️";
  return "📚";
}

interface Step2Props {
  selectedCourse: CourseItem | null;
  onSelect: (course: CourseItem) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function Step2Course({ selectedCourse, onSelect, onContinue, onBack }: Step2Props) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCourses() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: CourseItem[] = (data ?? []).map((c) => ({
        id: c.id as string,
        name: c.title as string,
        emoji: courseEmoji(c.title as string, (c.slug as string) ?? ""),
        desc: (c.description as string) ?? "",
        price: c.price as number,
      }));

      setCourses(mapped);

      const preselect = new URLSearchParams(window.location.search).get("course");
      if (preselect) {
        const match = mapped.find((c) => c.id === preselect);
        if (match) onSelect(match);
      }
    } catch {
      setError("Unable to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="text-[1.4rem] font-bold text-gray-900 mb-1">Choose your course</h2>
      <p className="text-[13.5px] text-gray-500 mb-6">Pick the programme that matches your goals.</p>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-10 mb-6 text-center">
          <p className="text-[13.5px] text-red-600 mb-3">{error}</p>
          <button
            onClick={fetchCourses}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0056D2] hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {courses.map((course) => {
            const selected = selectedCourse?.id === course.id;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelect(course)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-[#0056D2] bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {selected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#0056D2] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                )}
                <span className="text-xl block mb-2">{course.emoji}</span>
                <p className={`text-[13px] font-bold leading-snug mb-1 ${selected ? "text-[#0056D2]" : "text-gray-900"}`}>
                  {course.name}
                </p>
                <p className="text-[11px] text-gray-500 line-clamp-2">{course.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedCourse || loading}
          className="flex-1 bg-[#0056D2] hover:bg-[#0047B3] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[14.5px] py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
