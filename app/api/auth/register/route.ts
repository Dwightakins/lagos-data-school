import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(request: Request) {
  let body: {
    fullName?: string;
    email?: string;
    password?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    // Efficient email check via users table (avoids fetching all auth users)
    const { data: existingProfile } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in to continue.", userId: existingProfile.id },
        { status: 409 }
      );
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error || !data.user) {
      // Handle race condition: email registered between our check and create
      const msg = error?.message?.toLowerCase() ?? "";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in to continue." },
          { status: 409 }
        );
      }
      throw new Error(error?.message ?? "Account creation failed.");
    }

    const { error: profileError } = await admin.from("users").upsert(
      {
        id: data.user.id,
        email,
        full_name: fullName,
        role: "student",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      throw new Error(`Could not save student profile: ${profileError.message}`);
    }

    return NextResponse.json({ userId: data.user.id });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
