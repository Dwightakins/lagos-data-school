import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentType = "full" | "scholarship";

// The server decides what a student pays. Never use a paymentType sent by the browser
// (or stored in browser-supplied popup metadata) to choose the price.
//
// Scholarship pricing applies only when the student has an approved application for the
// course whose fee has not been paid yet. Everything else pays the full course price.
export async function resolvePaymentType(
  admin: SupabaseClient,
  userId: string,
  courseId: string
): Promise<PaymentType> {
  const { data } = await admin
    .from("scholarship_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "approved")
    .eq("payment_completed", false)
    .limit(1)
    .maybeSingle();

  return data ? "scholarship" : "full";
}

// Mark the approved application as paid so the scholarship price cannot be used twice.
export async function markScholarshipPaid(
  admin: SupabaseClient,
  userId: string,
  courseId: string
): Promise<void> {
  await admin
    .from("scholarship_applications")
    .update({ payment_completed: true })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "approved")
    .eq("payment_completed", false);
}
