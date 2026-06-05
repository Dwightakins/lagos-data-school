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
    .select("id, course_id, course_name, user_id, status, payment_completed, token_expires_at, users(full_name, email)")
    .eq("payment_token", token)
    .maybeSingle();

  if (error || !app) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  type AppRow = {
    id: string;
    course_id: string;
    course_name: string;
    user_id: string;
    status: string;
    payment_completed: boolean;
    token_expires_at: string | null;
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

  return NextResponse.json({
    valid: true,
    application: {
      id: row.id,
      courseName: row.course_name,
      studentName: row.users?.full_name ?? "Student",
      email: row.users?.email ?? "",
      userId: row.user_id,
      courseId: row.course_id,
    },
  });
}
