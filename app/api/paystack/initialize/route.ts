import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SCHOLARSHIP_PRICE = 8000;
const BULK_DISCOUNT_THRESHOLD = 3;
const BULK_DISCOUNT_RATE = 0.1;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function makeReference() {
  return `LDS-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

function computeFullPrice(prices: number[]): number {
  const total = prices.reduce((sum, p) => sum + p, 0);
  return prices.length >= BULK_DISCOUNT_THRESHOLD
    ? Math.round(total * (1 - BULK_DISCOUNT_RATE))
    : total;
}

export async function POST(request: Request) {
  let body: {
    userId?: string;
    fullName?: string;
    email?: string;
    courseIds?: string[]; // preferred: array of course IDs
    courseId?: string;    // backward compat: single course ID
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

  if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
    return NextResponse.json({ error: "Paystack public key is not configured." }, { status: 500 });
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

    // Fetch all requested courses
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

    // Check for existing paid enrollments — prevent charging twice
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

    // Server computes authoritative expected amount — prevents client-side price tampering
    const expectedAmount =
      paymentType === "scholarship"
        ? SCHOLARSHIP_PRICE
        : computeFullPrice(typedCourses.map((c) => c.price));

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json({ error: "Invalid course price." }, { status: 400 });
    }

    const courseNames = typedCourses.map((c) => c.title).join(", ");
    const reference = makeReference();

    return NextResponse.json({
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      reference,
      email,
      amount: expectedAmount * 100, // kobo for Paystack
      expectedAmount,               // Naira for display
      currency: "NGN",
      courseIds,                    // all IDs so verify can enroll each
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

