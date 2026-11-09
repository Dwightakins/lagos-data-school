import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAlatpayTransaction } from "@/lib/payments/alatpay";
import { PAYMENT_CONFIG } from "@/lib/payment-config";
import { assignStudentId } from "@/lib/student-id";
import { sendOnboardingEmail } from "@/lib/emails/onboarding";

type AdminClient = ReturnType<typeof createAdminClient>;

export type CompleteScholarshipResult =
  | { ok: true; alreadyDone: boolean; studentId: string | null; newAccount: boolean }
  | { ok: false; status: number; error: string; retryable: boolean };

type ApplicationRow = {
  id: string;
  user_id: string | null;
  course_id: string;
  course_name: string | null;
  status: string;
  payment_completed: boolean | null;
  payment_reference: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
};

const fail = (status: number, error: string, retryable = false): CompleteScholarshipResult => ({
  ok: false,
  status,
  error,
  retryable,
});

/** Escape LIKE wildcards so an email is matched literally by ilike. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Finds an existing student account by email (case-insensitive). */
export async function findUserIdByEmail(admin: AdminClient, email: string): Promise<string | null> {
  if (!email) return null;
  const { data } = await admin
    .from("users")
    .select("id")
    .ilike("email", escapeLike(email))
    .limit(1)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** True when the user already has an active enrollment in a different course (one course per student). */
export async function hasOtherActiveEnrollment(
  admin: AdminClient,
  userId: string,
  courseId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .neq("course_id", courseId)
    .or("status.eq.active,status.is.null")
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

async function resolveAccount(
  admin: AdminClient,
  row: ApplicationRow,
): Promise<{ userId: string; created: boolean } | null> {
  if (row.user_id) return { userId: row.user_id, created: false };

  const email = (row.applicant_email ?? "").trim().toLowerCase();
  if (!email) return null;

  const existing = await findUserIdByEmail(admin, email);
  if (existing) return { userId: existing, created: false };

  const name = (row.applicant_name ?? "").trim() || "Student";
  const phone = (row.applicant_phone ?? "").trim();

  // email_confirm: true because the student proved they own this mailbox by using the
  // payment link that was emailed to it. No password is set; they set one from the email.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name, phone },
  });

  if (error || !data?.user) {
    // Another request (e.g. the webhook) may have just created the same account.
    const raced = await findUserIdByEmail(admin, email);
    if (raced) return { userId: raced, created: false };
    console.error("[scholarship/complete] createUser failed:", error?.message);
    return null;
  }

  const userId = (data.user as { id: string }).id;

  // The auth trigger already inserted a public.users row; fill in the details.
  const { error: profileError } = await admin
    .from("users")
    .upsert({ id: userId, email, full_name: name, phone, role: "student" }, { onConflict: "id" });
  if (profileError) {
    console.error("[scholarship/complete] profile upsert failed:", profileError.message);
  }

  return { userId, created: true };
}

/**
 * Finishes a scholarship payment: verifies it with ALATPay, creates or finds the student
 * account, enrolls them, records the payment, assigns a Student ID and sends the welcome
 * email (with a set-password link for brand new accounts).
 *
 * Safe to call more than once for the same payment (browser callback and webhook may both
 * run): every step is idempotent and only the call that flips payment_completed sends email.
 */
export async function completeScholarshipPayment(
  token: string,
  transactionId: string,
): Promise<CompleteScholarshipResult> {
  const admin = createAdminClient();

  const { data: app, error } = await admin
    .from("scholarship_applications")
    .select(
      "id, user_id, course_id, course_name, status, payment_completed, payment_reference, applicant_name, applicant_email, applicant_phone",
    )
    .eq("payment_token", token)
    .maybeSingle();

  if (error || !app) return fail(404, "Invalid payment link.");

  const row = app as ApplicationRow;

  if (row.payment_completed) {
    return { ok: true, alreadyDone: true, studentId: null, newAccount: false };
  }
  if (row.status !== "approved") return fail(400, "Application not approved.");

  // 1. Verify the payment with ALATPay. Never trust the browser.
  let verified: Awaited<ReturnType<typeof verifyAlatpayTransaction>>;
  try {
    verified = await verifyAlatpayTransaction(transactionId);
  } catch (err) {
    console.error("[scholarship/complete] ALATPay lookup failed:", err);
    return fail(502, "Could not verify payment with ALATPay.", true);
  }

  if (
    !verified.ok ||
    verified.status !== "success" ||
    verified.currency !== "NGN" ||
    verified.amountNaira < PAYMENT_CONFIG.scholarshipFee
  ) {
    return fail(400, "Payment not confirmed. Please contact support.");
  }

  // 2. The transaction must carry THIS application's token and the reference issued for it
  //    by token-initialize, so an unrelated payment cannot be replayed against it.
  const metaToken = verified.metadata.token;
  const metaReference = verified.metadata.reference;
  if (
    metaToken !== token ||
    !row.payment_reference ||
    metaReference !== row.payment_reference
  ) {
    console.error("[scholarship/complete] transaction does not match application", {
      applicationId: row.id,
      transactionId,
    });
    return fail(403, "This payment does not match your application. Please contact support.");
  }

  // 3. Account: use the linked one, an existing one with the same email, or create one.
  const account = await resolveAccount(admin, row);
  if (!account) {
    return fail(500, "Could not set up your student account. Please contact support.", true);
  }
  const { userId, created } = account;

  // 4. One payment can only ever be used for one student.
  const paymentRef = verified.reference;
  const { data: existingPayment } = await admin
    .from("payments")
    .select("id, user_id")
    .eq("reference", paymentRef)
    .maybeSingle();
  if (existingPayment && (existingPayment as { user_id: string }).user_id !== userId) {
    return fail(409, "This payment has already been used.");
  }

  // 5. Link the application to the account (keeps retries consistent).
  if (!row.user_id) {
    await admin
      .from("scholarship_applications")
      .update({ user_id: userId })
      .eq("id", row.id)
      .is("user_id", null);
  }

  // 6. Enrollment (unique on user_id + course_id, so a repeat is harmless).
  const { error: enrollError } = await admin.from("enrollments").insert({
    user_id: userId,
    course_id: row.course_id,
    type: "scholarship",
    status: "active",
    payment_status: "paid",
  });
  const enrollCode = (enrollError as { code?: string } | null)?.code;
  const enrollMessage = (enrollError as { message?: string } | null)?.message ?? "";
  if (enrollError && enrollCode !== "23505" && !enrollMessage.includes("duplicate")) {
    console.error("[scholarship/complete] enroll error:", enrollError);
    return fail(500, "Failed to create enrollment. Please contact support.", true);
  }

  // 7. Payment record (shows in payment history and admin revenue).
  const { error: paymentError } = await admin.from("payments").upsert(
    {
      user_id: userId,
      course_id: row.course_id,
      amount: verified.amountNaira,
      reference: paymentRef,
      status: "paid",
      provider: "alatpay",
    },
    { onConflict: "reference" },
  );
  if (paymentError) {
    console.error("[scholarship/complete] payment record error:", paymentError);
  }

  // 8. Student ID, e.g. LDSL/DA/001 (generated from the course the student enrolled in).
  const { data: courseRow } = await admin
    .from("courses")
    .select("title")
    .eq("id", row.course_id)
    .maybeSingle();
  const courseTitle =
    (courseRow as { title: string } | null)?.title ?? row.course_name ?? "Course";
  const studentId = await assignStudentId(userId, courseTitle);

  // 9. Mark paid. Only the call that flips false -> true sends the email, so a webhook and a
  //    browser callback running at the same time never produce two welcome emails.
  const { data: flipped, error: flipError } = await admin
    .from("scholarship_applications")
    .update({ payment_completed: true, amount_paid: verified.amountNaira, user_id: userId })
    .eq("id", row.id)
    .or("payment_completed.is.null,payment_completed.eq.false")
    .select("id");
  if (flipError) {
    console.error("[scholarship/complete] could not mark paid:", flipError);
    return fail(500, "Payment received but could not be recorded. Please contact support.", true);
  }
  const iFlipped = Array.isArray(flipped) && flipped.length > 0;

  if (iFlipped) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const email = (row.applicant_email ?? "").trim().toLowerCase();

    let setPasswordUrl: string | null = null;
    if (created && email) {
      const { data: link, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
      });
      const hashed = (link as { properties?: { hashed_token?: string } } | null)?.properties
        ?.hashed_token;
      if (linkError || !hashed) {
        console.error("[scholarship/complete] generateLink failed:", linkError?.message);
      } else {
        setPasswordUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(hashed)}&type=recovery&next=/reset-password`;
      }
    }

    const { data: profile } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();
    const p = profile as { full_name: string | null; email: string | null } | null;
    const to = p?.email || email;

    if (to) {
      const sent = await sendOnboardingEmail({
        to,
        studentName: p?.full_name || row.applicant_name || "Student",
        courseName: courseTitle,
        amountPaid: verified.amountNaira,
        paymentType: "scholarship",
        orderId: paymentRef,
        studentId,
        enrolledAt: new Date().toISOString(),
        dashboardUrl: `${appUrl}/login`,
        setPasswordUrl,
      });
      if (!sent) console.error("[scholarship/complete] welcome email failed for", to);
    }
  }

  return { ok: true, alreadyDone: false, studentId, newAccount: created };
}
