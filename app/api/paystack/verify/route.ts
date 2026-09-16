import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignStudentId } from "@/lib/student-id";
import { sendOnboardingEmail } from "@/lib/emails/onboarding";
import { verifyAlatpayTransaction } from "@/lib/payments/alatpay";
import { getExpectedPaymentAmount } from "@/lib/payment-config";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: NextRequest) {
  let body: {
    reference?: string;
    userId?: string;
    courseIds?: string[];
    courseId?: string;
    paymentType?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { reference, userId } = body;
  const courseIds = body.courseIds ?? (body.courseId ? [body.courseId] : []);
  const paymentType = (body.paymentType ?? "full") as string;

  if (!reference || !userId || courseIds.length === 0) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const verified = await verifyAlatpayTransaction(reference);

    if (!verified.ok || verified.status !== "success") {
      return NextResponse.json(
        { error: `Payment was not successful (status: ${verified.status ?? "unknown"}). Please try again.` },
        { status: 402 }
      );
    }

    const amountPaidNaira = verified.amountNaira;

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

      if (amountPaidNaira < expectedAmount) {
        console.error(
          `[alatpay/verify] Amount mismatch: paid ₦${amountPaidNaira}, expected ₦${expectedAmount}`
        );
        return NextResponse.json(
          { error: "Payment amount mismatch. Please contact support." },
          { status: 402 }
        );
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

    const coursesToEnroll = courseIds.filter((id) => !alreadyEnrolledIds.has(id));

    if (coursesToEnroll.length > 0) {
      const enrollmentRows = coursesToEnroll.map((courseId) => ({
        user_id: userId,
        course_id: courseId,
        type: paymentType,
        status: "active",
        payment_status: "paid",
      }));

      const { error: enrollError } = await admin.from("enrollments").insert(enrollmentRows);
      if (enrollError) {
        console.error("[alatpay/verify] Enrollment insert error:", enrollError);
        throw new Error(`Could not save enrollment: ${enrollError.message}`);
      }
    }

    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (!existingPayment) {
      const { error: paymentError } = await admin.from("payments").insert({
        user_id: userId,
        course_id: courseIds[0],
        amount: amountPaidNaira,
        reference,
        status: "paid",
        provider: "alatpay",
      });
      if (paymentError) {
        console.error("[alatpay/verify] Payment record error:", paymentError);
      }
    }

    const { data: primaryCourse } = await admin
      .from("courses")
      .select("title")
      .eq("id", courseIds[0])
      .maybeSingle();

    const primaryTitle = (primaryCourse as { title: string } | null)?.title ?? "";
    const studentId = primaryTitle ? await assignStudentId(userId, primaryTitle) : null;

    const { data: studentProfile } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const studentEmail = (studentProfile as { full_name: string; email: string } | null)?.email ?? "";
    const studentName = (studentProfile as { full_name: string; email: string } | null)?.full_name ?? "Student";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    if (studentEmail) {
      void sendOnboardingEmail({
        to: studentEmail,
        studentName,
        courseName: primaryTitle || courseIds[0],
        amountPaid: amountPaidNaira,
        paymentType,
        orderId: reference,
        studentId,
        enrolledAt: new Date().toISOString(),
        dashboardUrl: `${appUrl}/login`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[alatpay/verify]", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
