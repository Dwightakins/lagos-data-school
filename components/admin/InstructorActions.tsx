"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";

interface Student { id: string; full_name: string; email: string; created_at: string; }

export default function InstructorActions({ students }: { students: Student[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [role, setRole] = useState("instructor");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function promote() {
    if (!selectedId) return;
    setSaving(true);
    const res = await fetch("/api/admin/users/role", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: selectedId, role }) });
    setSaving(false);
    if (res.ok) { setMsg(`Role updated to ${role}.`); setSelectedId(""); setTimeout(() => setMsg(null), 3000); }
    else { const d = await res.json(); setMsg(d.error ?? "Failed"); }
  }

  return (
    <div className="p-5 space-y-4">
      {msg && <div className="px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[13px] text-green-600">{msg}</div>}
      <div>
        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">Student</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none">
          <option value="">Select student...</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[12px] font-medium text-muted-foreground mb-1.5">New Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none">
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
          <option value="student">Student (demote)</option>
        </select>
      </div>
      <button onClick={promote} disabled={saving || !selectedId} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-[13px] transition-colors">
        <UserCheck className="w-4 h-4" /> {saving ? "Updating..." : "Update Role"}
      </button>
    </div>
  );
}
