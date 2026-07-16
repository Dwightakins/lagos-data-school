import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/assignments?lessonId=xxx — assignments for a lesson with the user's submission
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });

  const admin = createAdminClient();

  const { data: assignmentsData, error } = await admin
    .from("assignments")
    .select("id, course_id, lesson_id, title, instructions, due_date, points_possible, submission_type")
    .eq("lesson_id", lessonId)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assignments = (assignmentsData ?? []) as Array<{ id: string }>;
  if (assignments.length === 0) return NextResponse.json({ assignments: [] });

  const { data: submissionsData } = await admin
    .from("submissions")
    .select("id, assignment_id, file_url, text_content, url_content, score, feedback, graded_at, submitted_at")
    .eq("user_id", user.id)
    .in("assignment_id", assignments.map((a) => a.id));

  const submissions = (submissionsData ?? []) as Array<{ assignment_id: string }>;
  const withSubmissions = (assignmentsData ?? []).map((a: { id: string }) => ({
    ...a,
    submission: submissions.find((s) => s.assignment_id === a.id) ?? null,
  }));

  return NextResponse.json({ assignments: withSubmissions });
}
