import { createAdminClient } from "@/lib/supabase/admin";
import { Users, BookOpen, GraduationCap, Award, DollarSign, Plus, Megaphone, Clock } from "lucide-react";
import AdminCharts from "@/components/admin/AdminCharts";
import Link from "next/link";

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

async function getActivityFeed() {
  const admin = createAdminClient();
  const [enrollments, scholarships, payments] = await Promise.all([
    admin
      .from("enrollments")
      .select("id, enrolled_at, users(full_name), courses(title)")
      .order("enrolled_at", { ascending: false })
      .limit(5),
    admin
      .from("scholarship_applications")
      .select("id, created_at, applicant_name, course_name, status")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("payments")
      .select("id, created_at, amount, users(full_name), courses(title)")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  type FeedItem = {
    id: string;
    type: "enrollment" | "scholarship" | "payment";
    text: string;
    sub: string;
    ts: string;
  };

  const items: FeedItem[] = [];

  for (const e of (enrollments.data ?? []) as unknown as Array<{ id: string; enrolled_at: string; users: { full_name: string } | null; courses: { title: string } | null }>) {
    items.push({ id: e.id, type: "enrollment", text: `${e.users?.full_name ?? "Someone"} enrolled`, sub: e.courses?.title ?? "", ts: e.enrolled_at });
  }
  for (const s of (scholarships.data ?? []) as unknown as Array<{ id: string; created_at: string; applicant_name: string | null; course_name: string; status: string }>) {
    items.push({ id: s.id, type: "scholarship", text: `${s.applicant_name ?? "Applicant"} applied for scholarship`, sub: s.course_name, ts: s.created_at });
  }
  for (const p of (payments.data ?? []) as unknown as Array<{ id: string; created_at: string; amount: number; users: { full_name: string } | null; courses: { title: string } | null }>) {
    items.push({ id: p.id, type: "payment", text: `₦${Number(p.amount).toLocaleString("en-NG")} payment received`, sub: `${p.users?.full_name ?? ""} · ${p.courses?.title ?? ""}`, ts: p.created_at });
  }

  return items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 10);
}

async function getPendingScholarships() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("scholarship_applications")
    .select("id, created_at, applicant_name, course_name, applicant_email")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []) as unknown as Array<{ id: string; created_at: string; course_name: string; applicant_name: string | null; applicant_email: string | null }>;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const FEED_ICONS: Record<string, { bg: string; text: string; symbol: string }> = {
  enrollment: { bg: "bg-brand/10", text: "text-brand", symbol: "📚" },
  scholarship: { bg: "bg-amber-100", text: "text-amber-700", symbol: "🎓" },
  payment: { bg: "bg-green-100", text: "text-green-700", symbol: "₦" },
};

export default async function AdminDashboardPage() {
  const [stats, activity, pendingScholarships] = await Promise.all([
    getStats(),
    getActivityFeed(),
    getPendingScholarships(),
  ]);

  const revenueLabel = stats.totalRevenue >= 1_000_000
    ? `₦${(stats.totalRevenue / 1_000_000).toFixed(1)}M`
    : `₦${stats.totalRevenue.toLocaleString("en-NG")}`;

  const STAT_CARDS = [
    { label: "Total Students", value: String(stats.students), Icon: Users, href: "/admin/students" },
    { label: "Total Revenue", value: revenueLabel, Icon: DollarSign, href: "/admin/revenue" },
    { label: "Active Courses", value: String(stats.courses), Icon: BookOpen, href: "/admin/courses" },
    { label: "Pending Scholarships", value: String(stats.pendingScholarships), Icon: GraduationCap, href: "/admin/scholarships", urgent: stats.pendingScholarships > 0 },
    { label: "Certificates Issued", value: String(stats.certificates), Icon: Award, href: "/admin/certificates" },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-1">Admin Panel</p>
        <h1 className="text-[1.75rem] font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Overview of Lagos Data School</p>
      </div>

      {/* Stats — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {STAT_CARDS.map((s) => (
          <Link key={s.label} href={s.href} className={`bg-card border rounded-2xl p-5 shadow-sm hover:border-brand/40 transition-colors ${s.urgent ? "border-brand/40" : "border-border"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.urgent ? "bg-brand/15" : "bg-brand/8"}`}>
              <s.Icon className="w-4 h-4 text-brand" />
            </div>
            <p className={`text-[1.65rem] font-black ${s.urgent ? "text-brand" : "text-foreground"}`}>{s.value}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link
          href="/admin/courses"
          className="flex items-center gap-3 bg-brand hover:opacity-90 text-brand-foreground font-semibold text-[14px] px-5 py-3.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Add New Course</span>
        </Link>
        <Link
          href="/admin/scholarships"
          className="flex items-center gap-3 bg-card border border-border hover:border-brand/40 text-foreground font-semibold text-[14px] px-5 py-3.5 rounded-xl transition-colors"
        >
          <GraduationCap className="w-4 h-4 shrink-0 text-brand" />
          <span>Review Scholarships</span>
          {stats.pendingScholarships > 0 && (
            <span className="ml-auto text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
              {stats.pendingScholarships}
            </span>
          )}
        </Link>
        <Link
          href="/admin/announcements"
          className="flex items-center gap-3 bg-card border border-border hover:border-brand/40 text-foreground font-semibold text-[14px] px-5 py-3.5 rounded-xl transition-colors"
        >
          <Megaphone className="w-4 h-4 shrink-0 text-brand" />
          <span>Send Announcement</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-bold text-foreground">Recent Activity</h2>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          {activity.length === 0 ? (
            <p className="text-[13px] text-muted-foreground text-center py-6">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => {
                const style = FEED_ICONS[item.type];
                return (
                  <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold ${style.bg} ${style.text}`}>
                      {style.symbol}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{item.text}</p>
                      {item.sub && <p className="text-[11.5px] text-muted-foreground truncate">{item.sub}</p>}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(item.ts)}</span>
                  </div>
                );
              })}
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
            <p className="text-[13px] text-muted-foreground text-center py-6">No pending applications. 🎉</p>
          ) : (
            <div className="space-y-1">
              {pendingScholarships.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{app.applicant_name ?? "—"}</p>
                    <p className="text-[11.5px] text-muted-foreground truncate">{app.course_name}</p>
                  </div>
                  <Link href="/admin/scholarships" className="text-[11.5px] font-semibold text-brand hover:underline shrink-0 ml-3">
                    Review →
                  </Link>
                </div>
              ))}
              {stats.pendingScholarships > 5 && (
                <Link href="/admin/scholarships" className="block text-center text-[12px] text-brand font-semibold pt-2 hover:underline">
                  View all {stats.pendingScholarships} applications →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <AdminCharts />
    </div>
  );
}
