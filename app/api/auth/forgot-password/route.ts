import { NextRequest, NextResponse } from "next/server";
import { getClientIp, tooManyRequests } from "@/lib/spam-guard";
import { requestPasswordReset } from "@/lib/auth/password-reset";

// Always answers the same way, whether or not the email has an account.
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIp(req);
  if (
    tooManyRequests(`forgot-ip:${ip}`, 10, 10 * 60 * 1000) ||
    tooManyRequests(`forgot-email:${email}`, 3, 60 * 60 * 1000)
  ) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  try {
    await requestPasswordReset(email);
  } catch (err) {
    console.error("[api/auth/forgot-password]", err);
  }
  return NextResponse.json({ success: true });
}
