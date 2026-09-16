import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignStudentId } from "@/lib/student-id";
import { sendOnboardingEmail } from "@/lib/emails/onboarding";
import { verifyAlatpayTransaction } from "@/lib/payments/alatpay";
import { getExpectedPaymentAmount } from "@/lib/payment-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body) as {
      event?: string;
      data?: {
        reference?: string;
        amount?: number;
        metadata?: {
          userId?: string;
          fullName?: string;
          courseIds?: string[];
          courseId?: string;
          courseNames?: string;
          paymentType?: "full" | "scholarship";
        };
        customer?: { email?: string };
      };
    };

    const reference = event.data?.reference;
    if (!reference) {
      return NextResponse.json({ received: true });
    }

    const verified = await verifyAlatpayTransaction(reference);
    if (!verified.ok || verified.status !== "success") {
      return NextResponse.json({ received: true });
    }

    const { data } = event;
    const metadata = data?.metadata ?? {};
    const userId = metadata.userId;
    const fullName = metadata.fullName ?? "";
    const courseIds = metadata.courseIds ?? (metadata.courseId ? [metadata.courseId] : []);
    const paymentType = metadata.paymentType ?? "full";

    if (!userId || courseIds.length === 0) {
      console.error("[webhook] Missing userId or courseIds in metadata", { reference });
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();

    const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError || !authData.user) {
      console.error("[webhook] User not found:", userId);
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
        console.error(`[webhook] Amount mismatch: paid ₦${verified.amountNaira}, expected ₦${expectedAmount}`);
        return NextResponse.json({ received: true });
      }
    }

    await admin.from("users").upsert(
      { id: userId, email: data?.customer?.email ?? "", full_name: fullName, role: "student" },
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

    if (paymentType === "scholarship") {
      const { data: existingApplication } = await admin
        .from("scholarship_applications")
        .select("id")
        .eq("payment_reference", reference)
        .maybeSingle();

      if (existingApplication) {
        await admin
          .from("scholarship_applications")
          .update({
            user_id: userId,
            course_id: courseIds[0],
            status: "approved",
            amount_paid: verified.amountNaira,
          })
          .eq("id", existingApplication.id);
      } else {
        await admin.from("scholarship_applications").insert({
          user_id: userId,
          course_id: courseIds[0],
          course_name: metadata.courseNames ?? "",
          status: "approved",
          payment_reference: reference,
          amount_paid: verified.amountNaira,
        });
      }
    }

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
        }))
      );
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
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
