"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
}

function courseEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("data anal") || t.includes("analytics")) return "📊";
  if (t.includes("machine learn") || t.includes("neural") || t.includes(" ml")) return "🤖";
  if (t.includes("software") || t.includes("full-stack") || t.includes("web dev")) return "💻";
  if (t.includes("data eng") || t.includes("pipeline")) return "🔧";
  if (t.includes("python")) return "🐍";
  if (t.includes("sql") || t.includes("database")) return "🗄️";
  return "📚";
}

interface Step2Props {
  onContinue: () => void;
  onBack: () => void;
  onSelectCourse: (course: Course) => void;
}

export default function Step2Course({ onContinue, onBack, onSelectCourse }: Step2Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("courses")
          .select("id, title, description, price, thumbnail_url")
          .eq("is_published", true);

        if (error) {
          setError("Could not load courses. Please try again.");
          return;
        }
        setCourses(data || []);
      } catch {
        setError("Connection failed. Please check your internet and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div>
      <h2 className="text-[1.4rem] font-bold text-gray-900 mb-1">Choose your course</h2>
      <p className="text-[13.5px] text-gray-500 mb-6">Pick the programme that matches your goals.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {courses.map((course) => {
          const isSelected = selected === course.id;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => {
                setSelected(course.id);
                onSelectCourse(course);
              }}
              className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-[#0056D2] bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#0056D2] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}
              <span className="text-xl block mb-2">{courseEmoji(course.title)}</span>
              <p className={`text-[13px] font-bold leading-snug mb-1 ${isSelected ? "text-[#0056D2]" : "text-gray-900"}`}>
                {course.title}
              </p>
              <p className="text-[11px] text-gray-500 line-clamp-2">{course.description}</p>
            </button>
          );
        })}
      </div>

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
          disabled={!selected}
          className="flex-1 bg-[#0056D2] hover:bg-[#0047B3] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[14.5px] py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
