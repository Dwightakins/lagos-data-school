import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

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
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    // accept both snake_case (from page) and camelCase
    course_id?: string; courseId?: string;
    lesson_id?: string; lessonId?: string;
    module_id?: string; moduleId?: string;
    title: string;
    instructions?: string;
    due_date?: string; dueDate?: string;
    points_possible?: number; pointsPossible?: number;
    submission_type?: string; submissionType?: string;
  };

  const courseId = body.course_id ?? body.courseId;
  const lessonId = body.lesson_id ?? body.lessonId ?? null;
  const moduleId = body.module_id ?? body.moduleId ?? null;
  const dueDate = body.due_date ?? body.dueDate ?? null;
  const pointsPossible = body.points_possible ?? body.pointsPossible ?? 100;
  const submissionType = body.submission_type ?? body.submissionType ?? "file";

  if (!courseId) return NextResponse.json({ error: "course_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assignments")
    .insert({
      course_id: courseId,
      lesson_id: lessonId,
      module_id: moduleId,
      title: body.title,
      instructions: body.instructions ?? null,
      due_date: dueDate,
      points_possible: pointsPossible,
      submission_type: submissionType,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignment: data });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as { submissionId: string; score: number; feedback: string };
  if (!body.submissionId) return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });

  const admin = createAdminClient();
  await admin
    .from("submissions")
    .update({ score: body.score, feedback: body.feedback, graded_at: new Date().toISOString() })
    .eq("id", body.submissionId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("assignments").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
