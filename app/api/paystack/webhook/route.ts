import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify this is really from Paystack
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body) as {
      event: string;
      data: {
        reference: string;
        amount: number; // kobo
        metadata?: {
          userId?: string;
          fullName?: string;
          courseIds?: string[];
          courseId?: string; // backward compat
          courseNames?: string;
          paymentType?: "full" | "scholarship";
        };
        customer: { email: string };
      };
    };

    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const { reference, customer, amount, metadata } = event.data;
    const userId = metadata?.userId;
    const fullName = metadata?.fullName ?? "";
    const courseIds = metadata?.courseIds ?? (metadata?.courseId ? [metadata.courseId] : []);
    const paymentType = metadata?.paymentType ?? "full";

    if (!userId || courseIds.length === 0) {
      console.error("[webhook] Missing userId or courseIds in metadata", { reference });
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();

    // Validate user exists
    const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError || !authData.user) {
      console.error("[webhook] User not found:", userId);
      return NextResponse.json({ received: true });
    }

    // Re-derive expected amount from DB (tamper protection — Paystack metadata is unsigned)
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

      if (amount / 100 < expectedAmount) {
        console.error(`[webhook] Amount mismatch: paid ₦${amount / 100}, expected ₦${expectedAmount}`);
        return NextResponse.json({ received: true });
      }
    }

    // Upsert user profile
    await admin.from("users").upsert(
      { id: userId, email: customer.email, full_name: fullName, role: "student" },
      { onConflict: "id" }
    );

    // Record payment — check first so we know if this is a new transaction
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
        amount: amount / 100,
        reference,
        status: "paid",
        provider: "paystack",
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
            amount_paid: amount / 100,
          })
          .eq("id", existingApplication.id);
      } else {
        await admin.from("scholarship_applications").insert({
          user_id: userId,
          course_id: courseIds[0],
          course_name: metadata?.courseNames ?? "",
          status: "approved",
          payment_reference: reference,
          amount_paid: amount / 100,
        });
      }
    }

    // Enroll in all selected courses (idempotent)
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

    // Assign student ID (idempotent — returns existing if already set)
    const { data: primaryCourse } = await admin
      .from("courses")
      .select("title")
      .eq("id", courseIds[0])
      .maybeSingle();

    const primaryTitle = (primaryCourse as { title: string } | null)?.title ?? "";
    if (primaryTitle) {
      await assignStudentId(userId, primaryTitle);
    }

    // Send onboarding email only if this webhook fired before the verify route
    // (i.e. the payment record didn't already exist when we checked above)
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
          amountPaid: amount / 100,
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
    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 500 }
    );
  }
}
