import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();
  if ((data as { role?: string } | null)?.role !== "admin") return null;
  return admin;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const [userRes, enrollRes, paymentsRes, certsRes, notesRes] = await Promise.all([
    admin.from("users").select("id, full_name, email, phone, student_id, avatar_url, created_at, suspended, role").eq("id", id).single(),
    admin.from("enrollments").select("id, course_id, type, payment_status, enrolled_at, courses(title)").eq("user_id", id).order("enrolled_at", { ascending: false }),
    admin.from("payments").select("id, amount, status, created_at, courses(title)").eq("user_id", id).order("created_at", { ascending: false }).limit(10),
    admin.from("certificates").select("id, issued_at, courses(title)").eq("student_id", id).order("issued_at", { ascending: false }),
    admin.from("student_notes").select("id, note, created_at, users!admin_id(full_name)").eq("student_id", id).order("created_at", { ascending: false }),
  ]);

  if (userRes.error || !userRes.data) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  return NextResponse.json({
    student: userRes.data,
    enrollments: enrollRes.data ?? [],
    payments: paymentsRes.data ?? [],
    certificates: certsRes.data ?? [],
    adminNotes: notesRes.data ?? [],
  });
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: caller } = await admin.from("users").select("role").eq("id", user.id).single();
  if ((caller as { role?: string } | null)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await _req.json() as Record<string, unknown>;

  const ALLOWED = ["full_name", "phone", "suspended"];
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await admin.from("users").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If adding an admin note
  if (typeof body.adminNote === "string" && body.adminNote.trim()) {
    await admin.from("student_notes").insert({ student_id: id, admin_id: user.id, note: body.adminNote.trim() });
  }

  // Password reset — send reset email via Supabase Auth Admin
  if (body.resetPassword === true) {
    const { data: student } = await admin.from("users").select("email").eq("id", id).single();
    const studentEmail = (student as { email?: string } | null)?.email;
    if (studentEmail) {
      await admin.auth.admin.generateLink({ type: "recovery", email: studentEmail });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: caller } = await admin.from("users").select("role").eq("id", user.id).single();
  if ((caller as { role?: string } | null)?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
