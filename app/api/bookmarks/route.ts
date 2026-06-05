import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_bookmarks")
    .select(`id, created_at, lessons ( id, title, module_id, video_url, modules ( id, title, course_id, courses ( id, title, cover_image_url ) ) )`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookmarks: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await request.json() as { lessonId: string };
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_bookmarks")
    .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id" })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookmark: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("lesson_bookmarks").delete().eq("user_id", user.id).eq("lesson_id", lessonId);
  return NextResponse.json({ ok: true });
}
