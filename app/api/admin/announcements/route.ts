import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data } = await admin.from("announcements").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    title: string;
    message: string;
    target: string;
    // accept both snake_case (from page) and camelCase
    course_id?: string | null; courseId?: string | null;
    send_email?: boolean; sendEmail?: boolean;
    send_notif?: boolean; sendNotif?: boolean;
    scheduled_at?: string; scheduledAt?: string;
  };

  const courseId = body.course_id ?? body.courseId ?? null;
  const sendEmail = body.send_email ?? body.sendEmail ?? false;
  const sendNotif = body.send_notif ?? body.sendNotif ?? false;
  const scheduledAt = body.scheduled_at ?? body.scheduledAt ?? null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .insert({
      title: body.title,
      message: body.message,
      target: body.target,
      course_id: courseId,
      send_email: sendEmail,
      send_notif: sendNotif,
      scheduled_at: scheduledAt,
      sent_at: !scheduledAt ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fan out in-app notifications immediately if requested and not scheduled
  if (sendNotif && !scheduledAt) {
    let userIds: string[] = [];
    if (body.target === "all") {
      const { data: students } = await admin.from("users").select("id").eq("role", "student");
      userIds = ((students ?? []) as Array<{ id: string }>).map((s) => s.id);
    } else if (body.target === "course" && courseId) {
      const { data: enrollments } = await admin
        .from("enrollments")
        .select("user_id")
        .eq("course_id", courseId)
        .eq("payment_status", "paid");
      userIds = ((enrollments ?? []) as Array<{ user_id: string }>).map((e) => e.user_id);
    }
    if (userIds.length > 0) {
      await admin.from("notifications").insert(
        userIds.map((uid) => ({ user_id: uid, type: "announcement", title: body.title, message: body.message }))
      );
    }
  }

  return NextResponse.json({ announcement: data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("announcements").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
