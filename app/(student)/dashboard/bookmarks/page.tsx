"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkX, Play, BookOpen } from "lucide-react";

interface BookmarkItem {
  id: string;
  lesson_id: string;
  created_at: string;
  lessons: {
    id: string;
    title: string;
    duration_minutes: number | null;
    modules: {
      course_id: string;
      courses: { title: string; slug: string } | null;
    } | null;
  } | null;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => { setBookmarks(d.bookmarks ?? []); setLoading(false); });
  }, []);

  async function remove(lessonId: string) {
    await fetch(`/api/bookmarks?lessonId=${lessonId}`, { method: "DELETE" });
    setBookmarks((prev) => prev.filter((b) => b.lesson_id !== lessonId));
  }

  // Group by course
  const byCourse = bookmarks.reduce<Record<string, BookmarkItem[]>>((acc, b) => {
    const key = b.lessons?.modules?.courses?.title ?? "Unknown Course";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="px-6 lg:px-10 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-[1.5rem] font-bold text-foreground">Saved Lessons</h1>
        {bookmarks.length > 0 && <span className="text-[13px] text-muted-foreground">{bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}</span>}
      </div>

      <div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-foreground/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-12 h-12 text-border mx-auto mb-4" />
            <p className="text-[15px] font-semibold text-muted-foreground/60">No bookmarks yet</p>
            <p className="text-[13px] text-muted-foreground/40 mt-1">Bookmark lessons while watching to save them here.</p>
            <Link href="/dashboard/courses" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 rounded-xl text-[13px] font-semibold transition-colors">
              <BookOpen className="w-4 h-4" /> Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byCourse).map(([courseName, items]) => (
              <div key={courseName}>
                <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">{courseName}</p>
                <div className="space-y-2">
                  {items.map((b) => {
                    const lesson = b.lessons;
                    const courseId = lesson?.modules?.course_id;
                    const slug = lesson?.modules?.courses?.slug;
                    const href = courseId && lesson ? `/learn/${courseId}/${lesson.id}` : "#";
                    return (
                      <div key={b.id} className="flex items-center gap-4 bg-white/3 border border-border/50 rounded-2xl px-4 py-3 hover:bg-foreground/5 transition-colors group">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={href} className="text-[13px] font-semibold text-foreground hover:text-brand transition-colors truncate block">{lesson?.title ?? "Lesson"}</Link>
                          {lesson?.duration_minutes && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{lesson.duration_minutes} min</p>}
                        </div>
                        <button onClick={() => remove(b.lesson_id)} title="Remove bookmark" className="w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                          <BookmarkX className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
