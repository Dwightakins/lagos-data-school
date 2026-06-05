"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, BookOpen, Award, Clock, Flame, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Enrollment {
  id: string;
  enrolled_at: string;
  courses: { id: string; title: string } | null;
}

interface Progress {
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [certsCount, setCertsCount] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [enrollRes, certsRes, completedRes] = await Promise.all([
        supabase.from("enrollments").select("id, enrolled_at, courses ( id, title )").eq("user_id", user.id).eq("payment_status", "paid"),
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("student_id", user.id),
        supabase.from("lesson_progress").select("id", { count: "exact", head: true }).eq("student_id", user.id).eq("completed", true),
      ]);

      const enrs = (enrollRes.data ?? []) as unknown as Enrollment[];
      setEnrollments(enrs);
      setCertsCount(certsRes.count ?? 0);
      setTotalCompleted(completedRes.count ?? 0);

      const map: Record<string, Progress> = {};
      await Promise.all(enrs.map(async (e) => {
        if (!e.courses?.id) return;
        try {
          const res = await fetch(`/api/progress?courseId=${e.courses.id}`);
          if (res.ok) map[e.courses.id] = await res.json() as Progress;
        } catch { /* ignore */ }
      }));
      setProgressMap(map);
      setLoading(false);
    };
    load();
  }, [router]);

  const totalEnrolled = enrollments.length;
  const coursesCompleted = enrollments.filter((e) => e.courses?.id && (progressMap[e.courses.id]?.completionPercent ?? 0) === 100).length;
  const inProgress = totalEnrolled - coursesCompleted;

  const pieData = [
    { name: "Completed", value: coursesCompleted, color: "#0D9488" },
    { name: "In Progress", value: inProgress, color: "#CBD5E1" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground text-background px-6 py-4 flex items-center gap-3 border-b border-background/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center"><span className="font-black text-brand-foreground text-[11px]">LDS</span></div>
          <div className="hidden sm:flex flex-col leading-none"><span className="font-bold text-[13px]">Lagos Data School</span><span className="text-[9px] text-brand font-bold tracking-[0.2em] uppercase">Limited</span></div>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-brand transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Progress Reports</h1>
            <p className="text-muted-foreground text-[14px]">Your learning analytics and achievements</p>
          </div>
          <a href="/api/transcript" className="hidden sm:flex items-center gap-2 bg-brand hover:opacity-80 text-brand-foreground font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Download Transcript
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Enrolled", value: totalEnrolled, Icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Completed", value: coursesCompleted, Icon: Award, color: "text-brand", bg: "bg-background" },
            { label: "Certificates", value: certsCount, Icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Lessons Done", value: totalCompleted, Icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-[1.75rem] font-black text-foreground">{value}</p>
              <p className="text-[12px] text-muted-foreground font-medium">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-foreground mb-4">Course Status</h2>
            {totalEnrolled === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">No courses yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [String(v), ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-[12px] text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-course breakdown */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-[15px] font-bold text-foreground mb-4">Course Breakdown</h2>
            {enrollments.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">No courses enrolled yet.</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((e) => {
                  const prog = e.courses?.id ? progressMap[e.courses.id] : undefined;
                  const pct = prog?.completionPercent ?? 0;
                  return (
                    <div key={e.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-foreground truncate">{e.courses?.title ?? "—"}</span>
                        <span className="text-[12px] font-bold text-brand ml-2 shrink-0">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{prog?.completedLessons ?? 0}/{prog?.totalLessons ?? 0} lessons • {pct === 100 ? "Completed" : "In Progress"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <a href="/api/transcript" className="sm:hidden flex items-center justify-center gap-2 bg-brand hover:opacity-80 text-brand-foreground font-semibold text-[13px] px-4 py-2.5 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> Download Transcript
        </a>
      </div>
    </div>
  );
}


