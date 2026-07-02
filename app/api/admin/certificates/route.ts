import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();
  if ((data as { role?: string } | null)?.role !== "admin") return null;
  return admin;
}

// POST /api/admin/certificates — manually issue a certificate
export async function POST(request: Request) {
  const admin = await assertAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as { studentId: string; courseId: string };
  if (!body.studentId || !body.courseId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Check not already issued — user_id holds the auth UUID
  const { data: existing } = await admin
    .from("certificates")
    .select("id")
    .eq("user_id", body.studentId)
    .eq("course_id", body.courseId)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Certificate already exists" }, { status: 409 });

  // Fetch the human-readable student_id (e.g. LDSL/DA/001) from the users table
  const { data: studentRow } = await admin
    .from("users")
    .select("student_id")
    .eq("id", body.studentId)
    .single();

  const certNumber = `LDSL-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

  const { data, error } = await admin
    .from("certificates")
    .insert({
      user_id: body.studentId,
      course_id: body.courseId,
      issued_at: new Date().toISOString(),
      certificate_number: certNumber,
      student_id: (studentRow as { student_id?: string | null } | null)?.student_id ?? null,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ certificate: data });
}
