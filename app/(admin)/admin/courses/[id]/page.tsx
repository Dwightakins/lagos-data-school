"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-[#e8d89a] text-[14px] text-[#1a1a2e] placeholder-[#6b6040]/50 bg-[#fff8dc] focus:outline-none focus:ring-2 focus:ring-[#e63946]/20 focus:border-[#e63946] transition-all";

interface CourseData {
  id: string; title: string; slug: string; description: string; price: number; published: boolean;
}
interface LessonData {
  id: string; title: string; video_url: string | null; duration_minutes: number | null; order_index: number;
}
interface ModuleData {
  id: string; title: string; description: string; order_index: number;
  lessons: LessonData[];
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, ms = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function timeoutError(err: unknown): string {
  if (err instanceof Error && err.name === "AbortError") return "Request timed out. Try again.";
  return "Network error. Check your connection.";
}

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLesson, setNewLesson] = useState<Record<string, { title: string; video_url: string; duration: string }>>({});

  const load = useCallback(async () => {
    try {
      const [courseRes, modulesRes] = await Promise.all([
        fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
        fetch(`/api/admin/modules?courseId=${id}`).then((r) => r.json()),
      ]);
      if (!courseRes.course) {
        router.push("/admin/courses");
        return;
      }
      setCourse(courseRes.course as CourseData);
      setModules((modulesRes.modules ?? []) as ModuleData[]);
    } catch {
      setError("Failed to load course. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithTimeout(`/api/admin/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course),
      });
      if (res.ok) {
        showToast("Course saved.");
      } else {
        const j = await res.json() as { error?: string };
        setError(j.error ?? "Save failed.");
      }
    } catch (err) {
      setError(timeoutError(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourse() {
    if (!confirm("Delete this entire course? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetchWithTimeout(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/courses");
      } else {
        const j = await res.json() as { error?: string };
        setError(j.error ?? "Failed to delete course.");
        setDeleting(false);
      }
    } catch (err) {
      setError(timeoutError(err));
      setDeleting(false);
    }
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    setError("");
    try {
      const res = await fetchWithTimeout("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: id, title: newModuleTitle, orderIndex: modules.length }),
      });
      if (res.ok) {
        setNewModuleTitle("");
        await load();
      } else {
        const j = await res.json() as { error?: string };
        setError(j.error ?? "Failed to add module.");
      }
    } catch (err) {
      setError(timeoutError(err));
    } finally {
      setAddingModule(false);
    }
  }

  async function deleteModule(moduleId: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    setError("");
    try {
      const res = await fetchWithTimeout(`/api/admin/modules/${moduleId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        setError(j.error ?? "Failed to delete module.");
        return;
      }
      await load();
    } catch (err) {
      setError(timeoutError(err));
    }
  }

  async function addLesson(moduleId: string) {
    const l = newLesson[moduleId];
    if (!l?.title.trim()) return;
    const courseModule = modules.find((m) => m.id === moduleId);
    setError("");
    try {
      const res = await fetchWithTimeout("/api/admin/lessons", {
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
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        setError(j.error ?? "Failed to add lesson.");
        return;
      }
      setNewLesson((prev) => ({ ...prev, [moduleId]: { title: "", video_url: "", duration: "" } }));
      await load();
    } catch (err) {
      setError(timeoutError(err));
    }
  }

  async function deleteLesson(lessonId: string) {
    setError("");
    try {
      const res = await fetchWithTimeout(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        setError(j.error ?? "Failed to delete lesson.");
        return;
      }
      await load();
    } catch (err) {
      setError(timeoutError(err));
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e63946]" />
    </div>
  );
  if (!course) return null;

  return (
    <div className="p-8">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-brand transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

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
        <div className="space-y-4">
          <h2 className="text-[17px] font-bold text-[#1a1a2e]">Course Details</h2>
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

          {/* Sub-page links */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Materials", href: `/admin/courses/${id}/materials` },
              { label: "Quizzes", href: `/admin/courses/${id}/quizzes` },
              { label: "Assignments", href: `/admin/courses/${id}/assignments` },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-center px-3 py-2 rounded-xl border border-border text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Danger zone */}
          <div className="bg-card border border-red-200 rounded-xl p-4">
            <p className="text-[12px] font-bold text-red-500 uppercase tracking-wide mb-2">Danger Zone</p>
            <p className="text-[12.5px] text-muted-foreground mb-3">Permanently delete this course and all its modules, lessons, and materials.</p>
            <button
              type="button"
              onClick={deleteCourse}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 border border-red-300 hover:bg-red-50 disabled:opacity-60 text-red-600 font-semibold text-[13px] py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Deleting…" : "Delete Course"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
