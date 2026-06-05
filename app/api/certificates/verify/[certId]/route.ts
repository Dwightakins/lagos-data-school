import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/certificates/verify/[certId] — public endpoint for employer verification
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ certId: string }> }
) {
  const { certId } = await params;

  if (!certId) return NextResponse.json({ error: "Certificate ID is required." }, { status: 400 });

  const admin = createAdminClient();

  const { data: cert, error } = await admin
    .from("certificates")
    .select("id, student_id, course_id, issued_at")
    .eq("id", certId)
    .single();

  if (error || !cert) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  const certRow = cert as {
    id: string;
    student_id: string;
    course_id: string;
    issued_at: string;
  };

  // Fetch student name and course name in parallel
  const [studentResult, courseResult] = await Promise.all([
    admin.from("users").select("full_name").eq("id", certRow.student_id).single(),
    admin.from("courses").select("title").eq("id", certRow.course_id).single(),
  ]);

  const studentName =
    (studentResult.data as { full_name?: string } | null)?.full_name ?? "Unknown";
  const courseName =
    (courseResult.data as { title?: string } | null)?.title ?? "Unknown";

  return NextResponse.json({
    certId: certRow.id,
    studentName,
    courseName,
    issuedDate: certRow.issued_at,
  });
}
