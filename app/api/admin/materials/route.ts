import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).single();
  return (data as { role?: string } | null)?.role === "admin" ? user : null;
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  const admin = createAdminClient();
  let q = admin.from("lesson_materials").select("*, lessons ( title )").order("created_at");
  if (courseId) q = q.eq("course_id", courseId);
  if (lessonId) q = q.eq("lesson_id", lessonId);

  const { data } = await q;
  return NextResponse.json({ materials: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    courseId: string; lessonId?: string; fileName: string; fileUrl: string; fileType: string; fileSize?: number;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_materials")
    .insert({
      course_id: body.courseId, lesson_id: body.lessonId || null,
      file_name: body.fileName, file_url: body.fileUrl, file_type: body.fileType, file_size: body.fileSize || null,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ material: data });
}

export async function DELETE(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("lesson_materials").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
