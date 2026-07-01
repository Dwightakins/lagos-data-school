"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-gray-400 bg-card focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all";

export default function NewCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: "",
    published: false,
  });

  function set(field: string, value: string | boolean) {
    if (field === "title" && typeof value === "string") {
      setForm((f) => ({
        ...f,
        title: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      }));
    } else {
      setForm((f) => ({ ...f, [field]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = parseInt(form.price, 10);
    if (!form.title.trim() || !form.slug.trim() || !form.description.trim() || isNaN(price)) {
      setError("All fields are required and price must be a number.");
      return;
    }
    setSaving(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        router.push("/admin/courses");
      } else {
        const json = await res.json() as { error?: string };
        setError(json.error ?? "Failed to create course.");
        setSaving(false);
      }
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      setError(isTimeout ? "Request timed out. Try again." : "Network error. Check your connection.");
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-brand transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">New Course</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13.5px] rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 bg-card border border-border rounded-2xl p-6">
        <div>
          <label className="block text-[13px] font-bold text-foreground mb-1.5">Course Title</label>
          <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Data Analysis Bootcamp" className={INPUT} required />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-foreground mb-1.5">Slug</label>
          <input type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="data-analysis-bootcamp" className={INPUT} required />
          <p className="text-[11.5px] text-muted-foreground mt-1">URL-friendly identifier. Auto-generated from title.</p>
        </div>
        <div>
          <label className="block text-[13px] font-bold text-foreground mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="A brief overview of what this course covers…"
            rows={4}
            className={`${INPUT} resize-none`}
            required
          />
        </div>
        <div>
          <label className="block text-[13px] font-bold text-foreground mb-1.5">Price (₦)</label>
          <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="150000" min="0" className={INPUT} required />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="w-4 h-4 accent-[#0D9488] rounded"
          />
          <label htmlFor="published" className="text-[13.5px] font-semibold text-foreground">
            Publish immediately (visible to students)
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-foreground font-bold text-[14px] px-6 py-2.5 rounded-xl transition-colors shadow-md shadow-[#EA580C]/20 active:scale-[0.97]"
          >
            <Save className="w-4 h-4" />
            {saving ? "Creating…" : "Create Course"}
          </button>
          <Link
            href="/admin/courses"
            className="px-6 py-2.5 rounded-xl border border-border text-[14px] font-semibold text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
