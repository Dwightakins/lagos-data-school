import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, reason: "invalid" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: app, error } = await admin
    .from("scholarship_applications")
    .select(
      "id, course_id, course_name, user_id, status, payment_completed, token_expires_at, applicant_name, applicant_email, users(full_name, email)"
    )
    .eq("payment_token", token)
    .maybeSingle();

  if (error || !app) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  type AppRow = {
    id: string;
    course_id: string;
    course_name: string;
    user_id: string | null;
    status: string;
    payment_completed: boolean;
    token_expires_at: string | null;
    applicant_name: string | null;
    applicant_email: string | null;
    users: { full_name: string; email: string } | null;
  };

  const row = app as unknown as AppRow;

  if (row.payment_completed) {
    return NextResponse.json({ valid: false, reason: "already_paid" });
  }

  if (row.status !== "approved") {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  // Most scholarship applicants apply publicly, before they have an account, so their
  // contact details live on the application row (applicant_name/applicant_email), not
  // in `users`. Prefer a linked account's details when one exists, but always fall back.
  const studentName = row.users?.full_name || row.applicant_name || "Student";
  const email = row.users?.email || row.applicant_email || "";

  return NextResponse.json({
    valid: true,
    application: {
      id: row.id,
      courseName: row.course_name,
      studentName,
      email,
      userId: row.user_id,
      courseId: row.course_id,
    },
  });
}
