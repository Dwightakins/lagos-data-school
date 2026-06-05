import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: caller } = await admin.from("users").select("role").eq("id", user.id).single();
  if (caller?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, role } = await request.json() as { userId: string; role: string };
  const allowed = ["student", "instructor", "admin"];
  if (!userId || !allowed.includes(role)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { error } = await admin.from("users").update({ role }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
