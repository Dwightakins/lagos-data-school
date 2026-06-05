import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/emails/index";
import type { Certificate } from "@/types";

export interface CertIssuance {
  certificate: Certificate;
  alreadyExisted: boolean;
}

export interface CertResult {
  data?: CertIssuance;
  error?: string;
  status?: number;
}

/**
 * Issues a certificate for a student on a course.
 * Validates: all lessons completed + exam passed (if exam exists).
 * Idempotent — returns existing cert if already issued.
 */
export async function issueCourseCertificate(
  userId: string,
  courseId: string
): Promise<CertResult> {
  const admin = createAdminClient();

  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();

  if (courseError || !course) return { error: "Course not found.", status: 404 };

  const courseData = course as { id: string; title: string };

  // Resolve all lesson IDs for the course (via modules)
  const { data: modules } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", courseId);

  const moduleIds = ((modules ?? []) as Array<{ id: string }>).map((m) => m.id);

  if (moduleIds.length === 0) return { error: "Course has no lessons.", status: 400 };

  const { data: lessons } = await admin
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds);

  const lessonIds = ((lessons ?? []) as Array<{ id: string }>).map((l) => l.id);

  if (lessonIds.length === 0) return { error: "Course has no lessons.", status: 400 };

  // All lessons must be marked completed
  const { data: completedProgress } = await admin
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", userId)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  if ((completedProgress?.length ?? 0) < lessonIds.length)
    return { error: "All lessons must be completed first.", status: 400 };

  // Exam must be passed (only enforced if an exam exists for the course)
  const { data: exam } = await admin
    .from("exams")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();

  if (exam) {
    const examData = exam as { id: string };
    const { data: passedAttempt } = await admin
      .from("exam_attempts")
      .select("id")
      .eq("student_id", userId)
      .eq("exam_id", examData.id)
      .eq("passed", true)
      .maybeSingle();

    if (!passedAttempt)
      return { error: "Course exam must be passed first.", status: 400 };
  }

  // Idempotency — return existing certificate if already issued
  const { data: existing } = await admin
    .from("certificates")
    .select("id, student_id, course_id, issued_at, pdf_url")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    return { data: { certificate: existing as Certificate, alreadyExisted: true } };
  }

  // Insert new certificate
  const { data: cert, error: certError } = await admin
    .from("certificates")
    .insert({ student_id: userId, course_id: courseId })
    .select("id, student_id, course_id, issued_at, pdf_url")
    .single();

  if (certError || !cert)
    return { error: certError?.message ?? "Failed to issue certificate.", status: 500 };

  const certificate = cert as Certificate;

  // Send certificate email (non-fatal on failure)
  const { data: student } = await admin
    .from("users")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  const studentData = student as { email?: string; full_name?: string } | null;
  const studentEmail = studentData?.email;
  const studentName = studentData?.full_name ?? "Student";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (studentEmail) {
    try {
      await sendEmail({
        to: studentEmail,
        subject: `Certificate Earned — ${courseData.title}`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="background: linear-gradient(135deg, #0D9488, #134E4A); color: white; font-weight: 900; font-size: 14px; width: 56px; height: 56px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; letter-spacing: -0.5px;">LDS</div>
              <p style="margin: 6px 0 0; font-size: 10px; font-weight: 700; color: #0D9488; letter-spacing: 3px; text-transform: uppercase;">LIMITED</p>
              <h1 style="color: #134E4A; margin-top: 20px; font-size: 26px; font-weight: 800;">Congratulations, ${studentName}!</h1>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              You have successfully completed <strong>${courseData.title}</strong> and earned your verified certificate!
            </p>
            <div style="background: #F0FDFA; border: 2px solid #5EEAD4; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Certificate ID</p>
              <p style="margin: 10px 0 0; font-size: 15px; font-weight: 700; color: #0D9488; font-family: monospace;">${certificate.id}</p>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Employers can verify your certificate at:<br>
              <a href="${appUrl}/verify/${certificate.id}" style="color: #0D9488; font-weight: 600;">${appUrl}/verify/${certificate.id}</a>
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${appUrl}/dashboard/certificates"
                style="background: #EA580C; color: white; padding: 16px 36px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                View My Certificate
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e7e9ea; margin: 32px 0;">
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; line-height: 1.6;">
              Lagos Data School Limited &mdash; Built in Lagos. Designed for Africa.
            </p>
          </div>
        `,
      });
    } catch {
      // Email failure is non-fatal — certificate was already persisted
    }
  }

  return { data: { certificate, alreadyExisted: false } };
}
