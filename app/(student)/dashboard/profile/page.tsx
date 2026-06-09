"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Lock, CheckCircle2, AlertCircle } from "lucide-react";

const INPUT = "w-full px-3.5 py-2.5 rounded-lg border border-border text-[14px] text-foreground placeholder-gray-400 bg-card focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] transition-all";

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13.5px] font-medium mb-5 ${
      type === "success"
        ? "bg-background border border-brand/40 text-foreground"
        : "bg-red-50 border border-red-200 text-red-700"
    }`}>
      {type === "success"
        ? <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
        : <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [nameToast, setNameToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordToast, setPasswordToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data } = await supabase.from("users").select("full_name").eq("id", user.id).single();
      if (data) setFullName((data as { full_name: string }).full_name ?? "");
      setLoading(false);
    };
    load();
  }, [router]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setNameToast(null);
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ full_name: fullName.trim() }).eq("id", userId);
    setNameToast(
      error
        ? { message: "Failed to update name. Please try again.", type: "error" }
        : { message: "Name updated successfully.", type: "success" }
    );
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordToast(null);
    if (newPassword.length < 8) {
      setPasswordToast({ message: "New password must be at least 8 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordToast({ message: "Passwords do not match.", type: "error" });
      return;
    }
    setChangingPassword(true);
    const supabase = createClient();

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) {
      setPasswordToast({ message: "Current password is incorrect.", type: "error" });
      setChangingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordToast({ message: error.message, type: "error" });
    } else {
      setPasswordToast({ message: "Password changed successfully.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-[1.5rem] font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information and password.</p>
      </div>

      {/* Name Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-background border border-brand/40/50 flex items-center justify-center">
              <User className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-[15px] font-bold text-foreground">Personal Information</h2>
          </div>

          {nameToast && <Toast {...nameToast} />}

          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className={`${INPUT} bg-muted/40 text-muted-foreground cursor-not-allowed`}
              />
              <p className="text-[11.5px] text-muted-foreground mt-1">Email cannot be changed.</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-brand hover:opacity-80 disabled:opacity-60 text-white font-semibold text-[14px] px-6 py-2.5 rounded-lg transition-colors active:scale-[0.97]"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-background border border-brand/40/50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-brand" />
            </div>
            <h2 className="text-[15px] font-bold text-foreground">Change Password</h2>
          </div>

          {passwordToast && <Toast {...passwordToast} />}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-foreground mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className={INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white font-bold text-[14px] px-6 py-2.5 rounded-lg transition-colors active:scale-[0.97] shadow-md shadow-[#EA580C]/20"
            >
              {changingPassword ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
    </div>
  );
}

