import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlatpayConfig } from "@/lib/payments/alatpay";
import { PAYMENT_CONFIG } from "@/lib/payment-config";

export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const { publicKey, businessId } = getAlatpayConfig();
  if (!publicKey || !businessId) {
    return NextResponse.json({ error: "ALATPay credentials are not configured." }, { status: 500 });
  }

  const admin = createAdminClient();

  const { data: app, error } = await admin
    .from("scholarship_applications")
    .select("id, user_id, course_id, status, payment_completed, token_expires_at, applicant_email, users(email)")
    .eq("payment_token", token)
    .maybeSingle();

  if (error || !app) {
    return NextResponse.json({ error: "Invalid payment link." }, { status: 404 });
  }

  type AppRow = {
    id: string;
    user_id: string | null;
    course_id: string;
    status: string;
    payment_completed: boolean;
    token_expires_at: string | null;
    applicant_email: string | null;
    users: { email: string } | null;
  };

  const row = app as unknown as AppRow;

  if (row.payment_completed) {
    return NextResponse.json({ error: "This scholarship has already been paid." }, { status: 409 });
  }
  if (row.status !== "approved") {
    return NextResponse.json({ error: "This scholarship application is not approved." }, { status: 400 });
  }
  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "This payment link has expired." }, { status: 410 });
  }

  // Most scholarship applicants apply publicly, before they have an account, so their
  // email lives on the application row (applicant_email), not in `users`. Prefer a
  // linked account's email when one exists, but always fall back — ALATPay rejects the
  // transaction outright if email is missing ("Please add the customer email").
  const email = row.users?.email || row.applicant_email || "";
  if (!email) {
    console.error("[scholarship/token-initialize] no email on file for application:", row.id);
    return NextResponse.json(
      { error: "No email on file for this application. Please contact support." },
      { status: 400 }
    );
  }

  const reference = `LDS-SCH-${Date.now()}-${randomBytes(6).toString("hex")}`;

  // Bind this reference to this application. complete-payment will only accept a
  // reference that was actually issued for this token, so a valid ALATPay reference
  // from an unrelated payment can't be replayed here to mark the fee as paid.
  const { error: bindError } = await admin
    .from("scholarship_applications")
    .update({ payment_reference: reference })
    .eq("id", row.id);

  if (bindError) {
    console.error("[scholarship/token-initialize] failed to bind reference:", bindError);
    return NextResponse.json({ error: "Could not set up payment. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    apiKey: publicKey,
    businessId,
    reference,
    email,
    amount: PAYMENT_CONFIG.scholarshipFee,
  });
}
