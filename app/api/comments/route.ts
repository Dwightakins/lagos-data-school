import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });

  const sort = searchParams.get("sort") ?? "recent";
  const admin = createAdminClient();

  let q = admin
    .from("lesson_comments")
    .select(`id, comment_text, upvotes, created_at, parent_id, user_id, users ( full_name, avatar_url )`)
    .eq("lesson_id", lessonId)
    .is("parent_id", null);

  if (sort === "top") q = q.order("upvotes", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch replies
  const commentIds = ((data ?? []) as Array<{ id: string }>).map((c) => c.id);
  let replies: unknown[] = [];
  if (commentIds.length > 0) {
    const { data: replyData } = await admin
      .from("lesson_comments")
      .select(`id, comment_text, upvotes, created_at, parent_id, user_id, users ( full_name, avatar_url )`)
      .in("parent_id", commentIds)
      .order("created_at", { ascending: true });
    replies = replyData ?? [];
  }

  return NextResponse.json({ comments: data ?? [], replies });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { lessonId: string; commentText: string; parentId?: string };
  if (!body.lessonId || !body.commentText?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_comments")
    .insert({ lesson_id: body.lessonId, user_id: user.id, comment_text: body.commentText.trim(), parent_id: body.parentId || null })
    .select(`id, comment_text, upvotes, created_at, parent_id, user_id, users ( full_name, avatar_url )`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");
  if (!id || action !== "upvote") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const admin = createAdminClient();
  const { data: comment, error: fetchErr } = await admin
    .from("lesson_comments")
    .select("upvotes")
    .eq("id", id)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const current = (comment as { upvotes: number } | null)?.upvotes ?? 0;
  const { error } = await admin
    .from("lesson_comments")
    .update({ upvotes: current + 1 })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, upvotes: current + 1 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();

  // Check ownership (or admin)
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  const isAdmin = (profile as { role?: string } | null)?.role === "admin";
  const filter = admin.from("lesson_comments").delete().eq("id", id);
  if (!isAdmin) filter.eq("user_id", user.id);
  await filter;

  return NextResponse.json({ ok: true });
}
