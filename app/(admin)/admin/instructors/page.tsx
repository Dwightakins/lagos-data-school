import { createAdminClient } from "@/lib/supabase/admin";
import { Users, UserCheck } from "lucide-react";
import InstructorActions from "@/components/admin/InstructorActions";

async function getData() {
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("id, full_name, email, role, created_at").in("role", ["admin", "instructor"]).order("created_at", { ascending: false });
  const { data: students } = await admin.from("users").select("id, full_name, email, created_at").eq("role", "student").order("created_at", { ascending: false }).limit(50);
  return {
    staff: (data ?? []) as Array<{ id: string; full_name: string; email: string; role: string; created_at: string }>,
    students: (students ?? []) as Array<{ id: string; full_name: string; email: string; created_at: string }>,
  };
}

export default async function InstructorsPage() {
  const { staff, students } = await getData();

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-1">Admin Panel</p>
        <h1 className="text-[1.75rem] font-bold text-foreground">Instructors & Staff</h1>
        <p className="text-muted-foreground text-[14px] mt-1">Manage admin and instructor roles</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Staff list */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-[15px] font-bold text-foreground">Admin & Instructors</h2>
            <span className="text-[12px] text-muted-foreground">{staff.length} members</span>
          </div>
          {staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-[13px]">No staff members yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{s.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${s.role === "admin" ? "text-brand border-brand/30 bg-brand/10" : "text-orange-600 border-orange-300 bg-orange-50"}`}>{s.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promote students */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-[15px] font-bold text-foreground">Promote a Student</h2>
          </div>
          <InstructorActions students={students} />
        </div>
      </div>
    </div>
  );
}

