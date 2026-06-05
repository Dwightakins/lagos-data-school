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
  const admin = createAdminClient();
  let q = admin.from("quizzes").select("*, quiz_questions(*)").order("created_at");
  if (courseId) q = q.eq("course_id", courseId);
  const { data } = await q;
  return NextResponse.json({ quizzes: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json() as {
    courseId: string; moduleId?: string; title: string; passingScore: number; timeLimit?: number;
    questions?: Array<{ questionText: string; questionType: string; options?: Array<{ text: string; correct: boolean }>; correctAnswer?: string; points: number }>;
  };

  const admin = createAdminClient();
  const { data: quiz, error } = await admin
    .from("quizzes")
    .insert({ course_id: body.courseId, module_id: body.moduleId || null, title: body.title, passing_score: body.passingScore, time_limit: body.timeLimit || null })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.questions?.length) {
    const qRows = body.questions.map((q, i) => ({
      quiz_id: (quiz as { id: string }).id, question_text: q.questionText, question_type: q.questionType,
      options: q.options || null, correct_answer: q.correctAnswer || null, points: q.points, order_index: i,
    }));
    await admin.from("quiz_questions").insert(qRows);
  }

  return NextResponse.json({ quiz });
}

export async function DELETE(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("quizzes").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
