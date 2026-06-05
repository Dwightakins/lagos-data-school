import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Plus, BookOpen, Eye, EyeOff } from "lucide-react";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default async function AdminCoursesPage() {
  const admin = createAdminClient();
  const { data: courses } = await admin
    .from("courses")
    .select("id, title, slug, description, price, published, created_at")
    .order("created_at", { ascending: false });

  const list = (courses ?? []) as Array<{
    id: string; title: string; slug: string;
    description: string; price: number; published: boolean; created_at: string;
  }>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground text-[14px] mt-1">{list.length} course{list.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-foreground font-bold text-[14px] px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-[#EA580C]/20 active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          New Course
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-background border-2 border-brand/40 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-brand" />
          </div>
          <h2 className="text-[16px] font-bold text-foreground mb-2">No courses yet</h2>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 bg-brand hover:opacity-80 text-foreground font-semibold text-[14px] px-6 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((course) => (
            <div key={course.id} className="bg-card border border-border hover:border-brand/40/60 rounded-xl px-5 py-4 flex items-center justify-between gap-4 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 mb-0.5">
                  <h3 className="text-[14px] font-bold text-foreground truncate">{course.title}</h3>
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    course.published
                      ? "bg-background text-brand border-brand/40"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}>
                    {course.published ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                    {course.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-[12.5px] text-muted-foreground truncate">{course.description}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[14px] font-black text-foreground">{fmt(course.price)}</span>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="text-[13px] font-semibold text-brand border border-[#0D9488]/30 hover:bg-background px-4 py-1.5 rounded-lg transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



