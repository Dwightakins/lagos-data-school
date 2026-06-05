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
  const withSubmissions = searchParams.get("withSubmissions") === "true";

  const admin = createAdminClient();
  let q = admin.from("assignments").select(
    withSubmissions
      ? "*, submissions ( id, user_id, file_url, text_content, url_content, score, feedback, graded_at, submitted_at, users ( full_name, email ) )"
      : "*"
  ).order("created_at");
  if (courseId) q = q.eq("course_id", courseId);

  const { data } = await q;
  return NextResponse.json({ assignments: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    courseId: string; lessonId?: string; moduleId?: string; title: string;
    instructions: string; dueDate?: string; pointsPossible: number; submissionType: string;
  };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assignments")
    .insert({
      course_id: body.courseId, lesson_id: body.lessonId || null, module_id: body.moduleId || null,
      title: body.title, instructions: body.instructions, due_date: body.dueDate || null,
      points_possible: body.pointsPossible, submission_type: body.submissionType,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignment: data });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as { submissionId: string; score: number; feedback: string };
  if (!body.submissionId) return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("submissions").update({ score: body.score, feedback: body.feedback, graded_at: new Date().toISOString() }).eq("id", body.submissionId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("assignments").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
