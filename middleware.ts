import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Routes that require an authenticated session */
const PROTECTED = ["/dashboard", "/reset-password"];

/** Routes only accessible when NOT authenticated */
const AUTH_ONLY = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  // Refresh the Supabase session cookie (must run first)
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const needsGuard =
    PROTECTED.some((p) => pathname.startsWith(p)) ||
    AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (!needsGuard) return response;

  // Read-only client — just checks the session, no cookie writes needed here
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated user hitting a protected route → send to login
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting a login/register page → send to dashboard
  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
