import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const admin = createAdminClient();
  let q = admin.from("quizzes").select("*, quiz_questions(*)").order("created_at");
  if (courseId) q = q.eq("course_id", courseId);
  const { data } = await q;
  return NextResponse.json({ quizzes: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json() as {
    // accept both snake_case (from page) and camelCase
    course_id?: string; courseId?: string;
    module_id?: string; moduleId?: string;
    title: string;
    passing_score?: number; passingScore?: number;
    time_limit?: number; timeLimit?: number;
    questions?: Array<{
      question_text?: string; questionText?: string;
      question_type?: string; questionType?: string;
      options?: Array<{ text: string; correct: boolean }>;
      correct_answer?: string; correctAnswer?: string;
      points: number;
      order_index?: number;
    }>;
  };

  const courseId = body.course_id ?? body.courseId;
  const moduleId = body.module_id ?? body.moduleId ?? null;
  const passingScore = body.passing_score ?? body.passingScore ?? 70;
  const timeLimit = body.time_limit ?? body.timeLimit ?? null;

  if (!courseId) return NextResponse.json({ error: "course_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: quiz, error } = await admin
    .from("quizzes")
    .insert({ course_id: courseId, module_id: moduleId, title: body.title, passing_score: passingScore, time_limit: timeLimit })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.questions?.length) {
    const qRows = body.questions.map((q, i) => ({
      quiz_id: (quiz as { id: string }).id,
      question_text: q.question_text ?? q.questionText ?? "",
      question_type: q.question_type ?? q.questionType ?? "multiple_choice",
      options: q.options ?? null,
      correct_answer: q.correct_answer ?? q.correctAnswer ?? null,
      points: q.points,
      order_index: q.order_index ?? i,
    }));
    await admin.from("quiz_questions").insert(qRows);
  }

  return NextResponse.json({ quiz });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("quizzes").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
