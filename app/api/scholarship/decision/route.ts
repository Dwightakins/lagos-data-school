import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/api-auth";
import {
  sendScholarshipAcceptanceEmail,
  sendScholarshipRejectionEmail,
} from "@/lib/emails/scholarship-acceptance";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { applicationId, decision } = (await req.json()) as {
      applicationId: string;
      decision: "approved" | "rejected";
    };

    if (!applicationId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch application details — include applicant fields for public (no-account) applications
    const { data: app, error: appError } = await admin
      .from("scholarship_applications")
      .select("user_id, course_id, course_name, status, applicant_name, applicant_email")
      .eq("id", applicationId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (app.status !== "pending") {
      return NextResponse.json({ error: "Application already decided." }, { status: 409 });
    }

    // Resolve contact info — prefer linked account, fall back to applicant fields
    let studentName = (app as { applicant_name?: string }).applicant_name ?? "Student";
    let studentEmail = (app as { applicant_email?: string }).applicant_email ?? "";

    if (app.user_id) {
      const { data: profile } = await admin
        .from("users")
        .select("full_name, email")
        .eq("id", app.user_id)
        .single();
      if (profile) {
        studentName  = (profile as { full_name?: string }).full_name  ?? studentName;
        studentEmail = (profile as { email?: string }).email           ?? studentEmail;
      }
    }

    let paymentToken: string | undefined;

    if (decision === "approved") {
      paymentToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await admin
        .from("scholarship_applications")
        .update({
          status: "approved",
          payment_token: paymentToken,
          token_expires_at: expiresAt,
          payment_completed: false,
        })
        .eq("id", applicationId);
    } else {
      await admin
        .from("scholarship_applications")
        .update({ status: "rejected" })
        .eq("id", applicationId);
    }

    // Send decision email (non-fatal)
    if (studentEmail) {
      if (decision === "approved" && paymentToken) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const paymentUrl = `${appUrl}/scholarship-payment/${paymentToken}`;
        void sendScholarshipAcceptanceEmail({
          to: studentEmail,
          studentName,
          courseName: app.course_name as string,
          paymentUrl,
        });
      } else if (decision === "rejected") {
        void sendScholarshipRejectionEmail({
          to: studentEmail,
          studentName,
          courseName: app.course_name as string,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[scholarship/decision]", error);
    return NextResponse.json({ error: "Failed to process decision." }, { status: 500 });
  }
}
