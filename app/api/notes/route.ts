import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");

  const admin = createAdminClient();
  let q = admin
    .from("course_notes")
    .select(`id, note_text, video_timestamp, created_at, updated_at, lesson_id, lessons ( title, module_id, modules ( title, course_id, courses ( title ) ) )`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (lessonId) q = q.eq("lesson_id", lessonId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { lessonId: string; noteText: string; videoTimestamp?: number };
  if (!body.lessonId || !body.noteText?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_notes")
    .insert({ user_id: user.id, lesson_id: body.lessonId, note_text: body.noteText.trim(), video_timestamp: body.videoTimestamp ?? null })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { id: string; noteText: string };
  if (!body.id || !body.noteText?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("course_notes").update({ note_text: body.noteText.trim(), updated_at: new Date().toISOString() }).eq("id", body.id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("course_notes").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
