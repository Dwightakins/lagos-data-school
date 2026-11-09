import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Only these paths may be used as the post-login destination (prevents open redirects).
const ALLOWED_NEXT = ["/dashboard", "/courses", "/login", "/reset-password"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next = ALLOWED_NEXT.includes(nextParam) ? nextParam : "/dashboard";

  // PKCE flow: the "forgot password" email sent from the browser.
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  // Token-hash flow: the set-password link in the welcome email sent after a scholarship payment.
  if (tokenHash && type === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  // Code missing or session exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
