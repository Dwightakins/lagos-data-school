import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const allowedPaths = ["/dashboard", "/courses", "/login"];
      const safePath = allowedPaths.includes(next) ? next : "/dashboard";
      return NextResponse.redirect(new URL(safePath, origin));
    }
  }

  // Code missing or session exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
