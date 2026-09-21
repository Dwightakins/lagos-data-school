import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePaymentType } from "@/lib/payments/pricing";
import { getAlatpayConfig } from "@/lib/payments/alatpay";
import { getExpectedPaymentAmount } from "@/lib/payment-config";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function makeReference() {
  return `LDS-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

export async function POST(request: Request) {
  // Identity comes from the session, never from the request body.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  }

  // Only the course is read from the browser. Any userId, email or paymentType it sends is ignored.
  let body: { fullName?: string; courseIds?: string[]; courseId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userId = user.id;
  const email = (user.email ?? "").toLowerCase();
  const fullName = body.fullName?.trim() ?? "";
  const courseIds = body.courseIds ?? (body.courseId ? [body.courseId] : []);

  if (!email || courseIds.length === 0) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  // One course per student.
  if (courseIds.length !== 1) {
    return NextResponse.json({ error: "You can only enroll in one course at a time." }, { status: 400 });
  }

  const { publicKey, businessId } = getAlatpayConfig();
  if (!publicKey || !businessId) {
    return NextResponse.json({ error: "ALATPay credentials are not configured." }, { status: 500 });
  }

  const admin = createAdminClient();

  try {
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

    // Any active enrollment (including old rows with NULL status) blocks a new purchase.
    const { data: activeEnrollments } = await admin
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .or("status.eq.active,status.is.null");

    if (activeEnrollments && activeEnrollments.length > 0) {
      const sameCourse = (activeEnrollments as Array<{ course_id: string }>)
        .some((e) => courseIds.includes(e.course_id));
      if (sameCourse) {
        return NextResponse.json(
          {
            error: "You're already enrolled in this course. Head to your dashboard to continue learning.",
            alreadyEnrolled: true,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "You are already enrolled in a course. Complete your current course before enrolling in another." },
        { status: 403 }
      );
    }

    // The server decides the price: scholarship only with an approved, unpaid application.
    const paymentType = await resolvePaymentType(admin, userId, courseIds[0]);

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
      apiKey: publicKey,
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
    console.error("[alatpay/initialize]", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

