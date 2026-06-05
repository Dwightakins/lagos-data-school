"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-[#e8d89a] text-[14px] text-[#1a1a2e] placeholder-[#6b6040]/50 bg-[#fff8dc] focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] transition-all";

interface CourseData {
  id: string; title: string; slug: string; description: string; price: number; published: boolean;
}
interface ModuleData {
  id: string; title: string; description: string; order_index: number;
  lessons: LessonData[];
}
interface LessonData {
  id: string; title: string; video_url: string | null; duration_minutes: number | null; order_index: number;
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [newLesson, setNewLesson] = useState<Record<string, { title: string; video_url: string; duration: string }>>({});

  const load = useCallback(async () => {
    const supabase = createClient();
    const [courseRes, modulesRes] = await Promise.all([
      supabase.from("courses").select("id,title,slug,description,price,published").eq("id", id).single(),
      supabase.from("modules").select("id,title,description,order_index").eq("course_id", id).order("order_index"),
    ]);
    if (courseRes.error || !courseRes.data) { router.push("/admin/courses"); return; }
    const courseData = courseRes.data as CourseData;
    setCourse(courseData);

    const moduleList = (modulesRes.data ?? []) as Omit<ModuleData, "lessons">[];
    const withLessons: ModuleData[] = await Promise.all(
      moduleList.map(async (m) => {
        const { data: lessons } = await supabase
          .from("lessons").select("id,title,video_url,duration_minutes,order_index")
          .eq("module_id", m.id).order("order_index");
        return { ...m, lessons: (lessons ?? []) as LessonData[] };
      })
    );
    setModules(withLessons);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(course),
    });
    if (res.ok) { showToast("Course saved."); }
    else { const j = await res.json() as { error?: string }; setError(j.error ?? "Save failed."); }
    setSaving(false);
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    const res = await fetch("/api/admin/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: id, title: newModuleTitle, orderIndex: modules.length }),
    });
    if (res.ok) { setNewModuleTitle(""); await load(); }
    setAddingModule(false);
  }

  async function deleteModule(moduleId: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    await fetch(`/api/admin/modules/${moduleId}`, { method: "DELETE" });
    await load();
  }

  async function addLesson(moduleId: string) {
    const l = newLesson[moduleId];
    if (!l?.title.trim()) return;
    const courseModule = modules.find((m) => m.id === moduleId);
    await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId,
        title: l.title,
        videoUrl: l.video_url || null,
        durationMinutes: l.duration ? parseInt(l.duration, 10) : null,
        orderIndex: courseModule?.lessons.length ?? 0,
      }),
    });
    setNewLesson((prev) => ({ ...prev, [moduleId]: { title: "", video_url: "", duration: "" } }));
    await load();
  }

  async function deleteLesson(lessonId: string) {
    await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    await load();
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e63946]" />
    </div>
  );
  if (!course) return null;

  return (
    <div className="p-8">
      <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6b6040] hover:text-[#e63946] transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
      </Link>

      {toast && (
        <div className="bg-[#fef3b0] border border-[#5EEAD4] text-[#1a1a2e] text-[13px] font-semibold rounded-lg px-4 py-2.5 mb-5">
          {toast}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Modules + lessons */}
        <div>
          <h2 className="text-[17px] font-bold text-[#1a1a2e] mb-4">Curriculum</h2>

          {modules.map((courseModule, mi) => (
            <div key={courseModule.id} className="bg-[#fef3b0] border border-[#e8d89a] rounded-xl mb-4 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e8d89a] bg-[#fff8dc]">
                <GripVertical className="w-4 h-4 text-[#6b6040]/40 shrink-0" />
                <div className="w-6 h-6 rounded-md bg-[#e63946]/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-[#e63946]">{mi + 1}</span>
                </div>
                <span className="text-[14px] font-bold text-[#1a1a2e] flex-1">{courseModule.title}</span>
                <button type="button" onClick={() => deleteModule(courseModule.id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-4 py-3 space-y-2">
                {courseModule.lessons.map((lesson, li) => (
                  <div key={lesson.id} className="flex items-center gap-3 py-2 border-b border-[#e8d89a] last:border-0">
                    <span className="text-[11px] text-[#6b6040] w-5 text-center">{li + 1}</span>
                    <span className="text-[13px] text-[#1a1a2e] flex-1">{lesson.title}</span>
                    {lesson.duration_minutes && (
                      <span className="text-[11px] text-[#6b6040]">{lesson.duration_minutes}min</span>
                    )}
                    <button type="button" onClick={() => deleteLesson(lesson.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add lesson */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Lesson title"
                    value={newLesson[courseModule.id]?.title ?? ""}
                    onChange={(e) => setNewLesson((prev) => ({ ...prev, [courseModule.id]: { ...prev[courseModule.id], title: e.target.value } }))}
                    className="flex-1 px-3 py-1.5 text-[13px] border border-[#e8d89a] rounded-lg focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]/20"
                    onKeyDown={(e) => e.key === "Enter" && addLesson(courseModule.id)}
                  />
                  <input
                    type="text"
                    placeholder="Video URL"
                    value={newLesson[courseModule.id]?.video_url ?? ""}
                    onChange={(e) => setNewLesson((prev) => ({ ...prev, [courseModule.id]: { ...prev[courseModule.id], video_url: e.target.value } }))}
                    className="w-32 px-3 py-1.5 text-[13px] border border-[#e8d89a] rounded-lg focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]/20"
                  />
                  <input
                    type="number"
                    placeholder="Min"
                    value={newLesson[courseModule.id]?.duration ?? ""}
                    onChange={(e) => setNewLesson((prev) => ({ ...prev, [courseModule.id]: { ...prev[courseModule.id], duration: e.target.value } }))}
                    className="w-16 px-3 py-1.5 text-[13px] border border-[#e8d89a] rounded-lg focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946]/20"
                  />
                  <button type="button" onClick={() => addLesson(courseModule.id)}
                    className="flex items-center gap-1 bg-[#e63946] hover:bg-[#c1121f] text-foreground text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add module */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New module title…"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addModule()}
              className="flex-1 px-3.5 py-2.5 text-[14px] border border-dashed border-[#e8d89a] rounded-xl bg-[#fff8dc] focus:outline-none focus:border-[#e63946] focus:ring-2 focus:ring-[#e63946]/20"
            />
            <button
              type="button"
              onClick={addModule}
              disabled={addingModule || !newModuleTitle.trim()}
              className="flex items-center gap-2 bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-50 text-foreground font-semibold text-[13.5px] px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              {addingModule ? "Adding…" : "Add Module"}
            </button>
          </div>
        </div>

        {/* Course details form */}
        <div>
          <h2 className="text-[17px] font-bold text-[#1a1a2e] mb-4">Course Details</h2>
          <form onSubmit={saveCourse} className="bg-[#fef3b0] border border-[#e8d89a] rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[#6b6040] uppercase tracking-wide mb-1.5">Title</label>
              <input type="text" value={course.title} onChange={(e) => setCourse((c) => c && ({ ...c, title: e.target.value }))} className={INPUT} required />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#6b6040] uppercase tracking-wide mb-1.5">Slug</label>
              <input type="text" value={course.slug} onChange={(e) => setCourse((c) => c && ({ ...c, slug: e.target.value }))} className={INPUT} required />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#6b6040] uppercase tracking-wide mb-1.5">Description</label>
              <textarea value={course.description} onChange={(e) => setCourse((c) => c && ({ ...c, description: e.target.value }))} rows={4} className={`${INPUT} resize-none`} required />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#6b6040] uppercase tracking-wide mb-1.5">Price (₦)</label>
              <input type="number" value={course.price} onChange={(e) => setCourse((c) => c && ({ ...c, price: parseInt(e.target.value, 10) || 0 }))} min="0" className={INPUT} required />
            </div>
            <div className="flex items-center gap-3 py-1">
              <input
                type="checkbox"
                id="pub"
                checked={course.published}
                onChange={(e) => setCourse((c) => c && ({ ...c, published: e.target.checked }))}
                className="w-4 h-4 accent-[#e63946] rounded"
              />
              <label htmlFor="pub" className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1a1a2e] cursor-pointer">
                {course.published ? <Eye className="w-4 h-4 text-[#e63946]" /> : <EyeOff className="w-4 h-4 text-[#6b6040]" />}
                {course.published ? "Published" : "Draft — not visible to students"}
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-60 text-foreground font-bold text-[14px] py-2.5 rounded-xl transition-colors shadow-md shadow-[#e63946]/20 active:scale-[0.97]"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

