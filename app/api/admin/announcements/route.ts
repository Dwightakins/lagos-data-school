import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();
  if ((data as { role?: string } | null)?.role !== "admin") return null;
  return user;
}

export async function GET() {
  const supabase = await createClient();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin.from("announcements").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    title: string; message: string; target: string; courseId?: string;
    sendEmail: boolean; sendNotif: boolean; scheduledAt?: string;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("announcements")
    .insert({
      title: body.title, message: body.message, target: body.target,
      course_id: body.courseId || null, send_email: body.sendEmail,
      send_notif: body.sendNotif, scheduled_at: body.scheduledAt || null,
      sent_at: !body.scheduledAt ? new Date().toISOString() : null,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If sendNotif and no schedule, fan out notifications
  if (body.sendNotif && !body.scheduledAt) {
    let userIds: string[] = [];
    if (body.target === "all") {
      const { data: students } = await admin.from("users").select("id").eq("role", "student");
      userIds = ((students ?? []) as Array<{ id: string }>).map((s) => s.id);
    } else if (body.target === "course" && body.courseId) {
      const { data: enrollments } = await admin.from("enrollments").select("user_id").eq("course_id", body.courseId).eq("payment_status", "paid");
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
  const supabase = await createClient();
  const user = await requireAdmin(supabase);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("announcements").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
