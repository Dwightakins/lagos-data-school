"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus, BookOpen, Eye, EyeOff, Pencil, Trash2, Users,
  X, Save, ExternalLink, FileText, HelpCircle, ClipboardList,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  published: boolean;
  duration: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  enrollment_count: number;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  price: string;
  duration: string;
  cover_image_url: string;
  thumbnail_url: string;
  published: boolean;
}

const EMPTY_FORM: FormState = {
  title: "", slug: "", description: "", price: "250000",
  duration: "", cover_image_url: "", thumbnail_url: "", published: false,
};

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, ms = 10000) {
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

function netError(err: unknown) {
  if (err instanceof Error && err.name === "AbortError") return "Request timed out. Try again.";
  return "Network error. Check your connection.";
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Modal state
  const [modal, setModal] = useState<{ mode: "create" | "edit"; course?: Course } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Per-course toggling
  const [toggling, setToggling] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      const d = await res.json() as { courses?: Course[] };
      setCourses(d.courses ?? []);
    } catch {
      setError("Failed to load courses. Refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setModal({ mode: "create" });
  }

  function openEdit(course: Course) {
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      price: String(course.price),
      duration: course.duration ?? "",
      cover_image_url: course.cover_image_url ?? "",
      thumbnail_url: course.thumbnail_url ?? "",
      published: course.published,
    });
    setFormError("");
    setModal({ mode: "edit", course });
  }

  function setField(field: keyof FormState, value: string | boolean) {
    setForm((f) => {
      if (field === "title" && typeof value === "string") {
        return { ...f, title: value, slug: toSlug(value) };
      }
      return { ...f, [field]: value };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const price = parseInt(form.price, 10);
    if (!form.title.trim() || !form.slug.trim() || !form.description.trim() || isNaN(price)) {
      setFormError("Title, slug, description, and a valid price are required.");
      return;
    }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      price,
      published: form.published,
      duration: form.duration.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
    };

    try {
      if (modal?.mode === "create") {
        const res = await fetchWithTimeout("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const d = await res.json() as { course: Course };
          setCourses((prev) => [{ ...d.course, enrollment_count: 0 }, ...prev]);
          setModal(null);
          showToast("Course created successfully.");
        } else {
          const d = await res.json() as { error?: string };
          setFormError(d.error ?? "Failed to create course.");
        }
      } else if (modal?.mode === "edit" && modal.course) {
        const res = await fetchWithTimeout(`/api/admin/courses/${modal.course.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setCourses((prev) => prev.map((c) =>
            c.id === modal.course!.id ? { ...c, ...body } : c
          ));
          setModal(null);
          showToast("Course updated.");
        } else {
          const d = await res.json() as { error?: string };
          setFormError(d.error ?? "Failed to save course.");
        }
      }
    } catch (err) {
      setFormError(netError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetchWithTimeout(`/api/admin/courses/${confirmDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== confirmDelete.id));
        setConfirmDelete(null);
        showToast(`"${confirmDelete.title}" deleted.`);
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Failed to delete course.");
        setConfirmDelete(null);
      }
    } catch (err) {
      setError(netError(err));
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleTogglePublish(course: Course) {
    setToggling(course.id);
    try {
      const res = await fetchWithTimeout(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !course.published }),
      });
      if (res.ok) {
        setCourses((prev) => prev.map((c) =>
          c.id === course.id ? { ...c, published: !c.published } : c
        ));
        showToast(!course.published ? `"${course.title}" published.` : `"${course.title}" set to draft.`);
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Failed to update publish status.");
      }
    } catch (err) {
      setError(netError(err));
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="p-6 md:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background text-[13px] font-semibold px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground text-[14px] mt-0.5">
            {loading ? "Loading…" : `${courses.length} course${courses.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-bold text-[14px] px-5 py-2.5 rounded-xl transition-colors shadow-sm active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          New Course
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-2.5 mb-5">
          {error}
        </div>
      )}

      {/* Course list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-background border-2 border-brand/40 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-brand" />
          </div>
          <h2 className="text-[16px] font-bold text-foreground mb-2">No courses yet</h2>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-brand hover:opacity-80 text-brand-foreground font-semibold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first course
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-card border border-border rounded-xl px-5 py-4 transition-colors hover:border-brand/30">
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <h3 className="text-[15px] font-bold text-foreground">{course.title}</h3>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      course.published
                        ? "bg-brand/10 text-brand border-brand/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {course.published ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                      {course.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground line-clamp-1 mb-2">{course.description}</p>
                  {/* Stats row */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[13px] font-black text-foreground">{fmt(course.price)}</span>
                    {course.duration && (
                      <span className="text-[12px] text-muted-foreground">{course.duration}</span>
                    )}
                    <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {course.enrollment_count} student{course.enrollment_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(course)}
                    disabled={toggling === course.id}
                    title={course.published ? "Set to Draft" : "Publish"}
                    className={`p-2 rounded-lg border transition-colors disabled:opacity-50 ${
                      course.published
                        ? "border-brand/30 text-brand hover:bg-brand/10"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {course.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(course)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-brand hover:border-brand/30 transition-colors"
                    title="Edit course"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(course)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors"
                    title="Delete course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-page links */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mr-1">Manage:</span>
                {[
                  { label: "Content", href: `/admin/courses/${course.id}/content`, Icon: FileText },
                  { label: "Materials", href: `/admin/courses/${course.id}/materials`, Icon: ExternalLink },
                  { label: "Quizzes", href: `/admin/courses/${course.id}/quizzes`, Icon: HelpCircle },
                  { label: "Assignments", href: `/admin/courses/${course.id}/assignments`, Icon: ClipboardList },
                  { label: "Settings", href: `/admin/courses/${course.id}`, Icon: Pencil },
                ].map(({ label, href, Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-brand hover:bg-brand/5 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-brand/20"
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-[16px] font-bold text-foreground">
                {modal.mode === "create" ? "New Course" : "Edit Course"}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg px-4 py-2.5">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Data Analysis Bootcamp"
                  className={INPUT}
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="data-analysis-bootcamp"
                  className={INPUT}
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">Auto-generated from title. Appears in the course URL.</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Brief overview of what this course covers…"
                  rows={3}
                  className={`${INPUT} resize-none`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="250000"
                    min="0"
                    className={INPUT}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setField("duration", e.target.value)}
                    placeholder="e.g. 12 weeks"
                    className={INPUT}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={(e) => setField("cover_image_url", e.target.value)}
                  placeholder="https://…"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={form.thumbnail_url}
                  onChange={(e) => setField("thumbnail_url", e.target.value)}
                  placeholder="https://…"
                  className={INPUT}
                />
              </div>

              <div className="flex items-center gap-3 py-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.published}
                  onClick={() => setField("published", !form.published)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${form.published ? "bg-brand" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${form.published ? "translate-x-[18px]" : "translate-x-0"}`} />
                </button>
                <span className="text-[13.5px] font-semibold text-foreground">
                  {form.published ? "Published (visible to students)" : "Draft (hidden from students)"}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand hover:opacity-90 disabled:opacity-60 text-brand-foreground font-bold text-[14px] py-2.5 rounded-xl transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving…" : modal.mode === "create" ? "Create Course" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl border border-border text-[14px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-[16px] font-bold text-foreground mb-2">Delete Course</h2>
            <p className="text-[13.5px] text-muted-foreground mb-1">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">"{confirmDelete.title}"</span>?
            </p>
            <p className="text-[12.5px] text-red-500 font-medium mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold text-[14px] py-2.5 rounded-xl transition-colors"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 border border-border text-[14px] font-semibold text-muted-foreground hover:bg-muted/40 py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
