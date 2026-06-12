import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ exists: false });

  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}
