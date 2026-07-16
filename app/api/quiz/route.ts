import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface QuizRow {
  id: string;
  module_id: string | null;
  course_id: string;
  title: string;
  passing_score: number;
  time_limit: number | null;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  options: Array<{ text: string; correct: boolean }> | null;
  points: number;
  order_index: number;
}

// GET /api/quiz?courseId=xxx — list quizzes for a course with the user's best attempt
// GET /api/quiz?quizId=xxx   — quiz detail with questions (correct answers stripped)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const quizId = searchParams.get("quizId");
  const admin = createAdminClient();

  if (quizId) {
    const { data: quiz, error } = await admin
      .from("quizzes")
      .select("id, module_id, course_id, title, passing_score, time_limit")
      .eq("id", quizId)
      .single();
    if (error || !quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    const q = quiz as QuizRow;

    // Only enrolled students may fetch questions
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", q.course_id)
      .maybeSingle();
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

    const { data: questions } = await admin
      .from("quiz_questions")
      .select("id, quiz_id, question_text, question_type, options, points, order_index")
      .eq("quiz_id", quizId)
      .order("order_index");

    // Never send the correct flags/answers to the browser
    const safeQuestions = ((questions ?? []) as QuestionRow[]).map((row) => ({
      id: row.id,
      question_text: row.question_text,
      question_type: row.question_type,
      points: row.points,
      options:
        row.question_type === "true_false"
          ? ["True", "False"]
          : (row.options ?? []).map((o) => o.text),
    }));

    return NextResponse.json({ quiz: q, questions: safeQuestions });
  }

  if (courseId) {
    const [quizzesRes, attemptsRes] = await Promise.all([
      admin
        .from("quizzes")
        .select("id, module_id, course_id, title, passing_score, time_limit")
        .eq("course_id", courseId),
      admin
        .from("quiz_attempts")
        .select("quiz_id, score, passed, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false }),
    ]);

    const attempts = (attemptsRes.data ?? []) as Array<{
      quiz_id: string; score: number | null; passed: boolean | null; completed_at: string;
    }>;

    const quizzes = ((quizzesRes.data ?? []) as QuizRow[]).map((q) => {
      const mine = attempts.filter((a) => a.quiz_id === q.id);
      const best = mine.reduce<typeof mine[number] | null>(
        (acc, a) => (acc === null || (a.score ?? 0) > (acc.score ?? 0) ? a : acc),
        null
      );
      return {
        ...q,
        attempt: best ? { score: best.score, passed: !!best.passed } : null,
      };
    });

    return NextResponse.json({ quizzes });
  }

  return NextResponse.json({ error: "Missing courseId or quizId" }, { status: 400 });
}
