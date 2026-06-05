import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/quiz/attempt — submit a quiz attempt
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { quizId: string; answers: Array<{ questionId: string; answer: string }> };
  if (!body.quizId || !Array.isArray(body.answers)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();

  const { data: quiz, error: quizErr } = await admin
    .from("quizzes")
    .select("id, passing_score")
    .eq("id", body.quizId)
    .single();

  if (quizErr || !quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, question_type, options, correct_answer, points")
    .eq("quiz_id", body.quizId);

  const questionList = (questions ?? []) as Array<{
    id: string; question_type: string; options?: Array<{ text: string; correct: boolean }>; correct_answer?: string; points: number;
  }>;

  let totalPoints = 0;
  let earnedPoints = 0;

  questionList.forEach((q) => {
    totalPoints += q.points;
    const submitted = body.answers.find((a) => a.questionId === q.id);
    if (!submitted) return;

    if (q.question_type === "multiple_choice" || q.question_type === "true_false") {
      const correct = q.options?.find((o) => o.correct)?.text;
      if (correct && submitted.answer === correct) earnedPoints += q.points;
    } else if (q.question_type === "short_answer" && q.correct_answer) {
      if (submitted.answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) earnedPoints += q.points;
    }
  });

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (quiz as { passing_score: number }).passing_score;

  const { data: attempt, error: attemptErr } = await admin
    .from("quiz_attempts")
    .insert({ quiz_id: body.quizId, user_id: user.id, answers: body.answers, score, passed })
    .select().single();

  if (attemptErr) return NextResponse.json({ error: attemptErr.message }, { status: 500 });

  return NextResponse.json({ attempt, score, passed, earnedPoints, totalPoints });
}

// GET /api/quiz/attempt?quizId=xxx — get best attempt for current user
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get("quizId");
  if (!quizId) return NextResponse.json({ error: "Missing quizId" }, { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ attempt: data });
}
