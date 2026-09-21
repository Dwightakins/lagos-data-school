import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface PaymentDbRow {
  id: string;
  user_id: string;
  course_id: string | null;
  amount: number;
  reference: string | null;
  status: string;
  provider: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  courses: { title: string } | null;
}

// GET /api/payments/history
// Returns the signed-in student's payments, newest first.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // select("*") so this works whether the date column is paid_at or created_at.
  const { data, error } = await admin
    .from("payments")
    .select("*, courses(title)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as PaymentDbRow[];

  // payments and payment_intents share only `reference` (no FK), so look up types separately.
  const refs = rows.map((r) => r.reference).filter((r): r is string => !!r);
  const typeByRef: Record<string, string> = {};
  if (refs.length > 0) {
    const { data: intents } = await admin
      .from("payment_intents")
      .select("reference, payment_type")
      .in("reference", refs);
    ((intents ?? []) as Array<{ reference: string; payment_type: string }>).forEach((i) => {
      typeByRef[i.reference] = i.payment_type;
    });
  }

  const payments = rows
    .map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      reference: r.reference ?? "",
      status: r.status,
      provider: r.provider,
      paid_at: r.paid_at ?? r.created_at ?? null,
      course_title: r.courses?.title ?? null,
      payment_type: r.reference ? typeByRef[r.reference] ?? null : null,
    }))
    .sort((a, b) => (b.paid_at ?? "").localeCompare(a.paid_at ?? ""));

  return NextResponse.json({ payments });
}
