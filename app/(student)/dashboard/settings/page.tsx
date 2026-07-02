"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Trash2, Eye, EyeOff, Camera } from "lucide-react";

const TABS = ["Profile", "Security", "Notifications", "Account"] as const;
type Tab = typeof TABS[number];

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  student_id: string;
  avatar_url: string;
  notification_prefs: {
    new_lessons: boolean;
    course_updates: boolean;
    assignment_deadlines: boolean;
    scholarship_updates: boolean;
    weekly_report: boolean;
    marketing: boolean;
  };
}

const DEFAULT_PREFS = {
  new_lessons: true,
  course_updates: true,
  assignment_deadlines: true,
  scholarship_updates: true,
  weekly_report: false,
  marketing: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("Profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Security fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({ ...DEFAULT_PREFS });

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setAvatarPreview(data.avatar_url ?? null);
        setNotifPrefs({ ...DEFAULT_PREFS, ...(data.notification_prefs ?? {}) });
      }
      setLoading(false);
    }
    load();
  }, []);

  function showMsg(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function saveProfile() {
    setSaving(true);
    let avatarUrl = profile?.avatar_url ?? null;
    if (avatarFile) {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${user!.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrl;
      }
    }
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: fullName, phone, avatar_url: avatarUrl }) });
    setSaving(false);
    if (res.ok) showMsg("ok", "Profile saved."); else showMsg("err", "Failed to save profile.");
  }

  async function savePassword() {
    if (newPw !== confirmPw) { showMsg("err", "Passwords do not match."); return; }
    if (newPw.length < 8) { showMsg("err", "Password must be at least 8 characters."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) showMsg("err", error.message); else { showMsg("ok", "Password updated."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
  }

  async function saveNotifPrefs() {
    setSaving(true);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notification_prefs: notifPrefs }) });
    setSaving(false);
    if (res.ok) showMsg("ok", "Preferences saved."); else showMsg("err", "Failed to save preferences.");
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: deletePw }) });
    if (res.ok) { await supabase.auth.signOut(); router.replace("/"); } else { const d = await res.json(); showMsg("err", d.error ?? "Failed to delete account."); setDeleting(false); setDeleteOpen(false); }
  }

  const NOTIF_LABELS: Record<string, string> = {
    new_lessons: "New lessons published",
    course_updates: "Course updates",
    assignment_deadlines: "Assignment deadlines",
    scholarship_updates: "Scholarship updates",
    weekly_report: "Weekly progress report",
    marketing: "Promotions & news",
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="mb-8">
        <h1 className="text-[1.5rem] font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, security, and preferences.</p>
      </div>

      <div className="max-w-2xl">
        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-[13px] font-medium ${msg.type === "ok" ? "bg-teal-500/15 text-brand border border-teal-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-foreground/5 rounded-xl p-1 mb-8">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-[10px] sm:text-[13px] font-medium rounded-lg transition-colors whitespace-nowrap ${tab === t ? "bg-teal-500 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "Profile" && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/40 overflow-hidden flex items-center justify-center">
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-brand" />}
                </div>
                <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center hover:bg-teal-400 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-foreground" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
              </div>
              <div>
                <p className="text-[14px] font-semibold">{profile?.full_name}</p>
                <p className="text-[12px] text-muted-foreground">Student ID: {profile?.student_id ?? "—"}</p>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[14px] text-foreground focus:outline-none focus:border-brand/50" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">Email Address</label>
              <input value={profile?.email ?? ""} disabled className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-2.5 text-[14px] text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[14px] text-foreground focus:outline-none focus:border-brand/50" />
            </div>

            <button onClick={saveProfile} disabled={saving} className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-foreground font-semibold py-2.5 rounded-xl transition-colors text-[14px]">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {tab === "Security" && (
          <div className="space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[14px] text-foreground pr-10 focus:outline-none focus:border-brand/50" />
                <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[14px] text-foreground pr-10 focus:outline-none focus:border-brand/50" />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-0 top-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[14px] text-foreground focus:outline-none focus:border-brand/50" />
            </div>
            <button onClick={savePassword} disabled={saving || !newPw} className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-foreground font-semibold py-2.5 rounded-xl transition-colors text-[14px]">
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "Notifications" && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground mb-6">Choose which email notifications you receive.</p>
            {Object.entries(NOTIF_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <span className="text-[14px] text-border/800">{label}</span>
                <button
                  onClick={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifPrefs[key as keyof typeof notifPrefs] ? "bg-teal-500" : "bg-foreground/15"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-card transition-all ${notifPrefs[key as keyof typeof notifPrefs] ? "left-6" : "left-1"}`} />
                </button>
              </div>
            ))}
            <button onClick={saveNotifPrefs} disabled={saving} className="w-full mt-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-foreground font-semibold py-2.5 rounded-xl transition-colors text-[14px]">
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        )}

        {/* Account Tab */}
        {tab === "Account" && (
          <div className="space-y-6">
            <div className="bg-white/3 border border-border rounded-2xl p-5 space-y-3">
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">Account Info</p>
              <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Email</span><span className="text-foreground">{profile?.email}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Student ID</span><span className="text-foreground">{profile?.student_id ?? "—"}</span></div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
              <h3 className="text-[14px] font-semibold text-red-400 mb-1">Delete Account</h3>
              <p className="text-[12px] text-muted-foreground mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-2 text-[13px] font-semibold text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Delete Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-foreground border border-border rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-[16px] font-bold text-red-400 mb-2">Confirm Account Deletion</h3>
            <p className="text-[13px] text-muted-foreground mb-5">Enter your password to permanently delete your account.</p>
            <input type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} placeholder="Your password" className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-2.5 text-[14px] text-foreground mb-4 focus:outline-none focus:border-red-500/50" />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteOpen(false); setDeletePw(""); }} className="flex-1 py-2.5 rounded-xl border border-border text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={deleteAccount} disabled={deleting || !deletePw} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-foreground text-[13px] font-semibold">
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
