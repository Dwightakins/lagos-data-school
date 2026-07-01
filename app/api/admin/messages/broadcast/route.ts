import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as { courseId?: string; subject: string; body: string };
  if (!body.subject?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  let recipientIds: string[] = [];

  if (body.courseId) {
    const { data: enrollments } = await admin
      .from("enrollments")
      .select("user_id")
      .eq("course_id", body.courseId)
      .eq("status", "active");
    recipientIds = Array.from(new Set((enrollments ?? []).map((e: { user_id: string }) => e.user_id)));
  } else {
    const { data: students } = await admin
      .from("users")
      .select("id")
      .eq("role", "student");
    recipientIds = (students ?? []).map((s: { id: string }) => s.id);
  }

  if (recipientIds.length === 0) {
    return NextResponse.json({ error: "No recipients found" }, { status: 400 });
  }

  const rows = recipientIds.map((rid) => ({
    sender_id: auth.userId,
    recipient_id: rid,
    subject: body.subject.trim(),
    body: body.body.trim(),
  }));

  const { error } = await admin.from("messages").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, sent: recipientIds.length });
}
