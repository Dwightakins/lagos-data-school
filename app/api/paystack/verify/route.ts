import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignStudentId } from "@/lib/student-id";
import { sendOnboardingEmail } from "@/lib/emails/onboarding";

const SCHOLARSHIP_PRICE = 10000;
const BULK_DISCOUNT_THRESHOLD = 3;
const BULK_DISCOUNT_RATE = 0.1;

function computeFullPrice(prices: number[]): number {
  const total = prices.reduce((sum, p) => sum + p, 0);
  return prices.length >= BULK_DISCOUNT_THRESHOLD
    ? Math.round(total * (1 - BULK_DISCOUNT_RATE))
    : total;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

interface PaystackVerifyData {
  status: string; // "success" | "failed" | "abandoned"
  reference: string;
  amount: number; // in kobo
  customer: { email: string };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackVerifyData;
}

export async function POST(req: NextRequest) {
  let body: {
    reference?: string;
    userId?: string;
    courseIds?: string[];
    courseId?: string; // backward compat
    paymentType?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { reference, userId } = body;
  const courseIds = body.courseIds ?? (body.courseId ? [body.courseId] : []);

  if (!reference || !userId || courseIds.length === 0) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[paystack/verify] PAYSTACK_SECRET_KEY not configured");
    return NextResponse.json({ error: "Payment verification not configured." }, { status: 500 });
  }

  const admin = createAdminClient();

  try {
    // 1. Verify transaction with Paystack API
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paystackRes.ok) {
      const text = await paystackRes.text();
      console.error("[paystack/verify] Paystack API error:", paystackRes.status, text);
      return NextResponse.json(
        { error: "Payment verification failed. Please contact support if money was debited." },
        { status: 402 }
      );
    }

    const paystackData = (await paystackRes.json()) as PaystackVerifyResponse;

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json(
        { error: `Payment was not successful (status: ${paystackData.data?.status ?? "unknown"}). Please try again.` },
        { status: 402 }
      );
    }

    const amountPaidNaira = paystackData.data.amount / 100;
    const paymentType = (body.paymentType ?? "full") as string;

    // 2. Re-derive expected amount from DB to validate against what Paystack charged
    const { data: courses } = await admin
      .from("courses")
      .select("id, price")
      .in("id", courseIds);

    if (courses && courses.length > 0) {
      type CourseRow = { id: string; price: number };
      const expectedAmount =
        paymentType === "scholarship"
          ? SCHOLARSHIP_PRICE
          : computeFullPrice((courses as CourseRow[]).map((c) => c.price));

      if (amountPaidNaira < expectedAmount) {
        console.error(
          `[paystack/verify] Amount mismatch: paid ₦${amountPaidNaira}, expected ₦${expectedAmount}`
        );
        return NextResponse.json(
          { error: "Payment amount mismatch. Please contact support." },
          { status: 402 }
        );
      }
    }

    // 3. Idempotency: skip courses already enrolled
    const { data: existingEnrollments } = await admin
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .in("course_id", courseIds);

    const alreadyEnrolledIds = new Set(
      (existingEnrollments ?? []).map((e: { course_id: string }) => e.course_id)
    );

    const coursesToEnroll = courseIds.filter((id) => !alreadyEnrolledIds.has(id));

    if (coursesToEnroll.length === 0) {
      // All courses already enrolled — idempotent success
      return NextResponse.json({ success: true });
    }

    // 4. Insert enrollments
    const enrollmentRows = coursesToEnroll.map((courseId) => ({
      user_id: userId,
      course_id: courseId,
      type: paymentType,
      status: "active",
    }));

    const { error: enrollError } = await admin.from("enrollments").insert(enrollmentRows);
    if (enrollError) {
      console.error("[paystack/verify] Enrollment insert error:", enrollError);
      throw new Error(`Could not save enrollment: ${enrollError.message}`);
    }

    // 5. Payment record (linked to primary course — non-fatal if it fails)
    const { error: paymentError } = await admin.from("payments").insert({
      user_id: userId,
      course_id: courseIds[0],
      amount: amountPaidNaira,
      reference,
      status: "paid",
      provider: "paystack",
    });

    if (paymentError) {
      console.error("[paystack/verify] Payment record error:", paymentError);
    }

    // 6. Assign student ID based on first enrolled course (non-fatal)
    const { data: primaryCourse } = await admin
      .from("courses")
      .select("title")
      .eq("id", courseIds[0])
      .maybeSingle();

    const primaryTitle = (primaryCourse as { title: string } | null)?.title ?? "";
    const studentId = primaryTitle
      ? await assignStudentId(userId, primaryTitle)
      : null;

    // 7. Fetch student details for onboarding email (non-fatal)
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
        dashboardUrl: `${appUrl}/dashboard`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[paystack/verify]", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
