import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignStudentId } from "@/lib/student-id";
import { sendOnboardingEmail } from "@/lib/emails/onboarding";
import { isValidAlatpaySignature, verifyAlatpayTransaction } from "@/lib/payments/alatpay";
import { getExpectedPaymentAmount } from "@/lib/payment-config";
import { resolvePaymentType, markScholarshipPaid } from "@/lib/payments/pricing";

// ALATPay webhook payload (PascalCase), see docs "Setup Webhook URL".
type AlatpayWebhookBody = {
  Value?: {
    Data?: { Id?: string; Status?: string };
    Status?: boolean;
  };
};

export async function POST(req: NextRequest) {
  try {
    // Signature must be checked against the exact raw body.
    const body = await req.text();
    const signature = req.headers.get("x-signature");

    if (!process.env.ALATPAY_WEBHOOK_SECRET) {
      console.error("[alatpay/webhook] ALATPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (!isValidAlatpaySignature(body, signature)) {
      console.error("[alatpay/webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body) as AlatpayWebhookBody;
    const transactionId = event.Value?.Data?.Id;
    if (!transactionId) {
      return NextResponse.json({ received: true });
    }

    // Defence in depth: never trust the payload alone, re-check with ALATPay.
    const verified = await verifyAlatpayTransaction(transactionId);
    if (!verified.ok || verified.status !== "success" || verified.currency !== "NGN") {
      return NextResponse.json({ received: true });
    }

    const reference = verified.reference;
    const metadata = verified.metadata as {
      userId?: string;
      fullName?: string;
      courseIds?: string[];
      courseId?: string;
      courseNames?: string;
    };
    const userId = metadata.userId;
    const fullName = metadata.fullName ?? "";
    const courseIds = metadata.courseIds ?? (metadata.courseId ? [metadata.courseId] : []);

    if (!userId || courseIds.length === 0) {
      console.error("[alatpay/webhook] Missing userId or courseIds in metadata", { reference });
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();

    // The server decides the price. Popup metadata is browser-controlled and never trusted for this.
    const paymentType = await resolvePaymentType(admin, userId, courseIds[0]);

    const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError || !authData.user) {
      console.error("[alatpay/webhook] User not found:", userId);
      return NextResponse.json({ received: true });
    }

    const { data: courses } = await admin
      .from("courses")
      .select("id, price")
      .in("id", courseIds);

    if (courses && courses.length > 0) {
      type CourseRow = { id: string; price: number };
      const expectedAmount = getExpectedPaymentAmount(
        (courses as CourseRow[]).map((c) => c.price),
        paymentType
      );

      if (verified.amountNaira < expectedAmount) {
        console.error(`[alatpay/webhook] Amount mismatch: paid ₦${verified.amountNaira}, expected ₦${expectedAmount}`);
        return NextResponse.json({ received: true });
      }
    }

    await admin.from("users").upsert(
      { id: userId, email: verified.email || authData.user.email || "", full_name: fullName, role: "student" },
      { onConflict: "id" }
    );

    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    const isNewPayment = !existingPayment;

    await admin.from("payments").upsert(
      {
        user_id: userId,
        course_id: courseIds[0],
        amount: verified.amountNaira,
        reference,
        status: "paid",
        provider: "alatpay",
      },
      { onConflict: "reference" }
    );

    const { data: existingEnrollments } = await admin
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .in("course_id", courseIds);

    const alreadyEnrolledIds = new Set(
      (existingEnrollments ?? []).map((e: { course_id: string }) => e.course_id)
    );
    const toEnroll = courseIds.filter((id) => !alreadyEnrolledIds.has(id));

    if (toEnroll.length > 0) {
      await admin.from("enrollments").insert(
        toEnroll.map((courseId) => ({
          user_id: userId,
          course_id: courseId,
          type: paymentType,
          status: "active",
          payment_status: "paid",
        }))
      );
    }

    if (paymentType === "scholarship") {
      await markScholarshipPaid(admin, userId, courseIds[0]);
    }

    const { data: primaryCourse } = await admin
      .from("courses")
      .select("title")
      .eq("id", courseIds[0])
      .maybeSingle();

    const primaryTitle = (primaryCourse as { title: string } | null)?.title ?? "";
    if (primaryTitle) {
      await assignStudentId(userId, primaryTitle);
    }

    if (isNewPayment) {
      const { data: profile } = await admin
        .from("users")
        .select("full_name, email, student_id")
        .eq("id", userId)
        .maybeSingle();

      type ProfileRow = { full_name: string; email: string; student_id: string | null };
      const p = profile as ProfileRow | null;
      if (p?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        void sendOnboardingEmail({
          to: p.email,
          studentName: p.full_name ?? "Student",
          courseName: primaryTitle || courseIds[0],
          amountPaid: verified.amountNaira,
          paymentType,
          orderId: reference,
          studentId: p.student_id ?? null,
          enrolledAt: new Date().toISOString(),
          dashboardUrl: `${appUrl}/login`,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[alatpay/webhook] error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
