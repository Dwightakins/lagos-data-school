import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { issueCourseCertificate } from "@/lib/certificates";

interface SubmitExamBody {
  answers?: Record<string, string>;
}

// POST /api/exams/[id]/submit — submit answers for an exam
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;

  let body: SubmitExamBody;
  try {
    body = (await request.json()) as SubmitExamBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { answers } = body;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: exam, error: examError } = await admin
    .from("exams")
    .select("id, course_id, pass_score")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const examRow = exam as { id: string; course_id: string; pass_score: number };

  const { data: questions, error: questionsError } = await admin
    .from("exam_questions")
    .select("id, correct_answer")
    .eq("exam_id", examId);

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "No questions found for this exam." }, { status: 400 });
  }

  // Grade the submission
  const questionRows = questions as { id: string; correct_answer: string }[];
  const totalQuestions = questionRows.length;
  const correctCount = questionRows.filter(
    (q) => answers[q.id] === q.correct_answer
  ).length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= examRow.pass_score;

  const { error: attemptError } = await admin.from("exam_attempts").insert({
    student_id: user.id,
    exam_id: examId,
    score,
    passed,
    answers,
  });

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  // Auto-generate certificate if passed (non-fatal — lessons may not all be done yet)
  let certificate = null;
  if (passed) {
    const certResult = await issueCourseCertificate(user.id, examRow.course_id);
    if (certResult.data) {
      certificate = certResult.data.certificate;
    }
  }

  return NextResponse.json({
    score,
    passed,
    pass_score: examRow.pass_score,
    certificate,
  });
}
