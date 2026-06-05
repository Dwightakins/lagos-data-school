import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SCHOLARSHIP_FEE = 8_000;

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

  if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
    return NextResponse.json({ error: "Paystack public key is not configured." }, { status: 500 });
  }

  const admin = createAdminClient();

  const { data: app, error } = await admin
    .from("scholarship_applications")
    .select("id, user_id, course_id, status, payment_completed, token_expires_at, users(email)")
    .eq("payment_token", token)
    .maybeSingle();

  if (error || !app) {
    return NextResponse.json({ error: "Invalid payment link." }, { status: 404 });
  }

  type AppRow = {
    id: string;
    user_id: string;
    course_id: string;
    status: string;
    payment_completed: boolean;
    token_expires_at: string | null;
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

  const email = row.users?.email ?? "";
  const reference = `LDS-SCH-${Date.now()}-${randomBytes(6).toString("hex")}`;

  return NextResponse.json({
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    reference,
    email,
    amount: SCHOLARSHIP_FEE * 100, // kobo
  });
}
