import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Unauthenticated redirects ────────────────────────────────
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/checkout") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/learn") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // ── Email verification gate ────────────────────────────────
    // Redirect unconfirmed users to the verify-email page before
    // they can access any protected area.
    const isProtected =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/learn");

    if (isProtected && !user.email_confirmed_at) {
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }

    // ── Admin role gate ────────────────────────────────────────
    // Query the users table (RLS allows each user to read their own row).
    if (pathname.startsWith("/admin")) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (profile as { role?: string } | null)?.role;
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // ── Redirect logged-in users away from auth pages ──────────
    if (pathname === "/login" || pathname === "/register") {
      if (!user.email_confirmed_at) {
        return NextResponse.redirect(new URL("/verify-email", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/checkout/:path*",
    "/checkout",
    "/learn/:path*",
    "/login",
    "/register",
  ],
};
