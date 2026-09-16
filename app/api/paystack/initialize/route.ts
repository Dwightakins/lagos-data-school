import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAlatpayConfig } from "@/lib/payments/alatpay";
import { getExpectedPaymentAmount } from "@/lib/payment-config";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function makeReference() {
  return `LDS-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

export async function POST(request: Request) {
  let body: {
    userId?: string;
    fullName?: string;
    email?: string;
    courseIds?: string[];
    courseId?: string;
    paymentType?: "full" | "scholarship";
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const courseIds = body.courseIds ?? (body.courseId ? [body.courseId] : []);
  const paymentType = body.paymentType;

  if (!userId || !email || courseIds.length === 0 || !paymentType) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  if (paymentType !== "full" && paymentType !== "scholarship") {
    return NextResponse.json({ error: "Invalid payment type." }, { status: 400 });
  }

  const { apiKey, businessId } = getAlatpayConfig();
  if (!apiKey || !businessId) {
    return NextResponse.json({ error: "ALATPay credentials are not configured." }, { status: 500 });
  }

  const admin = createAdminClient();

  try {
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);
    if (authError || !authUser.user) {
      return NextResponse.json({ error: "Account not found. Please restart registration." }, { status: 401 });
    }

    if (authUser.user.email?.toLowerCase() !== email) {
      return NextResponse.json({ error: "Account email does not match payment email." }, { status: 400 });
    }

    const { data: courses, error: coursesError } = await admin
      .from("courses")
      .select("id, title, price, published")
      .in("id", courseIds);

    if (coursesError || !courses || courses.length === 0) {
      return NextResponse.json({ error: "Course(s) not found." }, { status: 404 });
    }

    type CourseRow = { id: string; title: string; price: number; published?: boolean };
    const typedCourses = courses as CourseRow[];

    const unavailable = typedCourses.filter((c) => c.published === false);
    if (unavailable.length > 0) {
      return NextResponse.json({ error: "One or more courses are not currently available." }, { status: 400 });
    }

    const { data: existingEnrollments } = await admin
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .in("course_id", courseIds)
      .eq("status", "active");

    if (existingEnrollments && existingEnrollments.length > 0) {
      return NextResponse.json(
        {
          error: "You're already enrolled in this course. Head to your dashboard to continue learning.",
          alreadyEnrolled: true,
        },
        { status: 409 }
      );
    }

    const expectedAmount = getExpectedPaymentAmount(
      typedCourses.map((c) => c.price),
      paymentType
    );

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json({ error: "Invalid course price." }, { status: 400 });
    }

    const courseNames = typedCourses.map((c) => c.title).join(", ");
    const reference = makeReference();

    return NextResponse.json({
      apiKey,
      businessId,
      reference,
      email,
      amount: expectedAmount,
      firstName: (fullName || "Student").split(" ")[0] || "Student",
      lastName: (fullName || "Student").split(" ").slice(1).join(" ") || "User",
      metadata: {
        userId,
        fullName,
        courseIds,
        courseNames,
        paymentType,
      },
    });
  } catch (error) {
    console.error("[paystack/initialize]", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

