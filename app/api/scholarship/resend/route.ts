import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/api-auth";
import { sendScholarshipAcceptanceEmail } from "@/lib/emails/scholarship-acceptance";

// Vercel Hobby allows up to 60s. Emails are sent one by one and awaited.
export const maxDuration = 60;

const TOKEN_DAYS = 7;
const TIME_BUDGET_MS = 45_000; // stop starting new sends after this; the rest are reported as skipped
const GAP_MS = 600;            // pause between sends to stay under Resend's rate limit

type AppRow = {
  id: string;
  user_id: string | null;
  course_name: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  payment_token: string | null;
};

/**
 * POST /api/scholarship/resend
 * Body: { applicationId: string }  -> resend to one approved, unpaid applicant
 *       { all: true }              -> resend to every approved, unpaid applicant
 *
 * Re-sends the scholarship acceptance email (same content and layout as the original).
 * The existing payment token is kept so older links keep working; its expiry is reset
 * to 7 days from now so the "expires in 7 days" wording in the email is accurate.
 * A new token is created only if the application has none.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { applicationId?: string; all?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.applicationId && !body.all) {
    return NextResponse.json({ error: "Provide applicationId or all: true." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    let query = admin
      .from("scholarship_applications")
      .select("id, user_id, course_name, applicant_name, applicant_email, payment_token")
      .eq("status", "approved")
      .or("payment_completed.is.null,payment_completed.eq.false");

    if (body.applicationId) query = query.eq("id", body.applicationId);

    const { data, error } = await query;
    if (error) {
      console.error("[scholarship/resend] query error:", error);
      return NextResponse.json({ error: "Could not load applications." }, { status: 500 });
    }

    const rows = (data ?? []) as AppRow[];
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No approved, unpaid application found." },
        { status: 404 },
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const started = Date.now();
    const sent: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    for (const row of rows) {
      // Resolve contact details: linked account first, then the applicant_* columns.
      let name = row.applicant_name ?? "Student";
      let email = row.applicant_email ?? "";
      if (row.user_id) {
        const { data: profile } = await admin
          .from("users")
          .select("full_name, email")
          .eq("id", row.user_id)
          .single();
        if (profile) {
          name = (profile as { full_name?: string }).full_name ?? name;
          email = (profile as { email?: string }).email ?? email;
        }
      }
      const label = `${name} <${email || "no email"}>`;

      if (!email) {
        failed.push(label);
        continue;
      }
      if (Date.now() - started > TIME_BUDGET_MS) {
        skipped.push(label);
        continue;
      }

      const token = row.payment_token ?? crypto.randomUUID();
      const expiresAt = new Date(Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await admin
        .from("scholarship_applications")
        .update({ payment_token: token, token_expires_at: expiresAt })
        .eq("id", row.id);
      if (updateError) {
        console.error("[scholarship/resend] update error:", row.id, updateError);
        failed.push(label);
        continue;
      }

      const ok = await sendScholarshipAcceptanceEmail({
        to: email,
        studentName: name,
        courseName: row.course_name ?? "your selected course",
        paymentUrl: `${appUrl}/scholarship-payment/${token}`,
      });

      (ok ? sent : failed).push(label);
      await new Promise((r) => setTimeout(r, GAP_MS));
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      sent: sent.length,
      failed,
      skipped,
    });
  } catch (err) {
    console.error("[scholarship/resend]", err);
    return NextResponse.json({ error: "Failed to resend emails." }, { status: 500 });
  }
}
