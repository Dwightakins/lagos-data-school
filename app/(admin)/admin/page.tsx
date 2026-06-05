import { createAdminClient } from "@/lib/supabase/admin";
import { Users, BookOpen, GraduationCap, Award, DollarSign } from "lucide-react";
import AdminCharts from "@/components/admin/AdminCharts";

async function getStats() {
  const admin = createAdminClient();
  const [students, enrollments, scholarships, certificates, courses, payments] = await Promise.all([
    admin.from("users").select("id", { count: "exact", head: true }).eq("role", "student"),
    admin.from("enrollments").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
    admin.from("scholarship_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("certificates").select("id", { count: "exact", head: true }),
    admin.from("courses").select("id", { count: "exact", head: true }).eq("published", true),
    admin.from("payments").select("amount").eq("status", "paid"),
  ]);
  const totalRevenue = ((payments.data ?? []) as unknown as Array<{ amount: number }>)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  return {
    students: students.count ?? 0,
    enrollments: enrollments.count ?? 0,
    pendingScholarships: scholarships.count ?? 0,
    certificates: certificates.count ?? 0,
    courses: courses.count ?? 0,
    totalRevenue,
  };
}

async function getRecentEnrollments() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("enrollments")
    .select("id, enrolled_at, user_id, course_id, users(full_name, email), courses(title)")
    .order("enrolled_at", { ascending: false })
    .limit(8);
  return (data ?? []) as unknown as Array<{
    id: string;
    enrolled_at: string;
    users: { full_name: string; email: string } | null;
    courses: { title: string } | null;
  }>;
}

async function getPendingScholarships() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("scholarship_applications")
    .select("id, created_at, user_id, course_name, users(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    course_name: string;
    users: { full_name: string; email: string } | null;
  }>;
}

export default async function AdminDashboardPage() {
  const [stats, recentEnrollments, pendingScholarships] = await Promise.all([
    getStats(),
    getRecentEnrollments(),
    getPendingScholarships(),
  ]);

  const revenueLabel = stats.totalRevenue >= 1_000_000
    ? `₦${(stats.totalRevenue / 1_000_000).toFixed(1)}M`
    : `₦${stats.totalRevenue.toLocaleString("en-NG")}`;

  const STAT_CARDS = [
    { label: "Total Students", value: String(stats.students), Icon: Users },
    { label: "Total Revenue", value: revenueLabel, Icon: DollarSign },
    { label: "Published Courses", value: String(stats.courses), Icon: BookOpen },
    { label: "Pending Scholarships", value: String(stats.pendingScholarships), Icon: GraduationCap, urgent: stats.pendingScholarships > 0 },
    { label: "Certificates Issued", value: String(stats.certificates), Icon: Award },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-1">Admin Panel</p>
        <h1 className="text-[1.75rem] font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Overview of Lagos Data School</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`bg-card border rounded-2xl p-5 shadow-sm ${s.urgent ? "border-brand/40" : "border-border"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.urgent ? "bg-brand/15" : "bg-brand/8"}`}>
              <s.Icon className="w-4 h-4 text-brand" />
            </div>
            <p className={`text-[1.65rem] font-black ${s.urgent ? "text-brand" : "text-foreground"}`}>{s.value}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-bold text-foreground">Recent Enrollments</h2>
            <span className="text-[12px] text-muted-foreground">Last 8</span>
          </div>
          {recentEnrollments.length === 0 ? (
            <p className="text-[13px] text-muted-foreground text-center py-6">No enrollments yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((enr) => (
                <div key={enr.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{enr.users?.full_name ?? "—"}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate">{enr.courses?.title ?? "—"}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 ml-3">
                    {new Date(enr.enrolled_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Scholarships */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-bold text-foreground">Pending Scholarships</h2>
            {stats.pendingScholarships > 0 && (
              <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded-full">
                {stats.pendingScholarships} pending
              </span>
            )}
          </div>
          {pendingScholarships.length === 0 ? (
            <p className="text-[13px] text-muted-foreground text-center py-6">No pending applications.</p>
          ) : (
            <div className="space-y-3">
              {pendingScholarships.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{app.users?.full_name ?? "—"}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate">{app.course_name}</p>
                  </div>
                  <a
                    href="/admin/scholarships"
                    className="text-[11.5px] font-semibold text-brand hover:underline shrink-0 ml-3"
                  >
                    Review →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <AdminCharts />
    </div>
  );
}

