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

async function generateCertificatePdf(
  studentName: string,
  courseName: string,
  duration: string | null,
  issuedDate: string,
  certId: string,
  displayCertNumber: string,
  appUrl: string
): Promise<Buffer | null> {
  try {
    // Dynamic import avoids issues if jspdf has canvas deps in some envs
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = 297;
    const H = 210;

    // Dark outer background
    doc.setFillColor(3, 54, 43);
    doc.rect(0, 0, W, H, "F");

    // White inner card
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 14, W - 28, H - 28, 6, 6, "F");

    // Teal top accent bar
    doc.setFillColor(13, 148, 136);
    doc.rect(14, 14, W - 28, 7, "F");

    // Official logo — top-left of the card (transparent PNG, ~2.41:1)
    try {
      const { readFile } = await import("fs/promises");
      const { join } = await import("path");
      const logoData = await readFile(join(process.cwd(), "public", "images", "logo.png"));
      doc.addImage(`data:image/png;base64,${logoData.toString("base64")}`, "PNG", 20, 25, 26, 10.8);
    } catch {
      // Logo is decorative — certificate still generates without it
    }

    // School name
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 148, 136);
    doc.text("LAGOS DATA SCHOOL LIMITED", W / 2, 33, { align: "center" });

    // Thin divider under school name
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(W / 2 - 50, 36, W / 2 + 50, 36);

    // Title
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("Certificate of Completion", W / 2, 54, { align: "center" });

    // "This certifies that"
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("This certifies that", W / 2, 70, { align: "center" });

    // Student name — largest text
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(3, 78, 58);
    doc.text(studentName, W / 2, 86, { align: "center" });

    // Decorative line under name
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.8);
    doc.line(W / 2 - 55, 90, W / 2 + 55, 90);

    // "has successfully completed"
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("has successfully completed", W / 2, 100, { align: "center" });

    // Course name
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    const courseLines = doc.splitTextToSize(courseName, 220) as string[];
    doc.text(courseLines, W / 2, 112, { align: "center" });

    // Duration (optional)
    if (duration) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 140, 140);
      doc.text(`Programme Duration: ${duration}`, W / 2, 126, { align: "center" });
    }

    // Bottom info strip (3 columns)
    const bottomY = 151;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, bottomY - 5, W - 28, 26, "F");

    // Left: Certificate ID
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text("CERTIFICATE ID", 28, bottomY + 2);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(9);
    doc.text(displayCertNumber, 28, bottomY + 8);

    // Center: Completion date
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text("DATE OF COMPLETION", W / 2, bottomY + 2, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.text(issuedDate, W / 2, bottomY + 8, { align: "center" });

    // Right: Verify URL
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text("VERIFY ONLINE", W - 28, bottomY + 2, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(8);
    doc.text(`${appUrl}/verify/${certId}`, W - 28, bottomY + 8, { align: "right" });

    // Bottom teal bar
    doc.setFillColor(13, 148, 136);
    doc.rect(14, H - 21, W - 28, 7, "F");

    // Lagos Data School text in bottom bar
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Lagos Data School Limited — Built in Lagos. Designed for Africa.", W / 2, H - 16, { align: "center" });

    return Buffer.from(doc.output("arraybuffer"));
  } catch {
    return null;
  }
}

/**
 * Issues a certificate for a student on a course.
 * Validates: all lessons completed + exam passed (if exam exists).
 * Idempotent — returns existing cert if already issued.
 * Generates and uploads a PDF to Supabase Storage.
 */
export async function issueCourseCertificate(
  userId: string,
  courseId: string
): Promise<CertResult> {
  const admin = createAdminClient();

  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, duration")
    .eq("id", courseId)
    .single();

  if (courseError || !course) return { error: "Course not found.", status: 404 };

  const courseData = course as { id: string; title: string; duration?: string | null };

  // Resolve all lesson IDs for the course (via modules)
  const { data: modules } = await admin.from("modules").select("id").eq("course_id", courseId);
  const moduleIds = ((modules ?? []) as Array<{ id: string }>).map((m) => m.id);
  if (moduleIds.length === 0) return { error: "Course has no lessons.", status: 400 };

  const { data: lessons } = await admin.from("lessons").select("id").in("module_id", moduleIds);
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
  const { data: exam } = await admin.from("exams").select("id").eq("course_id", courseId).maybeSingle();
  if (exam) {
    const examData = exam as { id: string };
    const { data: passedAttempt } = await admin
      .from("exam_attempts")
      .select("id")
      .eq("student_id", userId)
      .eq("exam_id", examData.id)
      .eq("passed", true)
      .maybeSingle();
    if (!passedAttempt) return { error: "Course exam must be passed first.", status: 400 };
  }

  // Idempotency — return existing certificate if already issued
  const { data: existing } = await admin
    .from("certificates")
    .select("id, student_id, course_id, issued_at, pdf_url, certificate_number, status")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    return { data: { certificate: existing as Certificate, alreadyExisted: true } };
  }

  // Fetch student data for cert number and PDF
  const { data: student } = await admin
    .from("users")
    .select("email, full_name, student_id")
    .eq("id", userId)
    .single();

  const studentData = student as { email?: string; full_name?: string; student_id?: string | null } | null;
  const studentName = studentData?.full_name ?? "Student";
  const studentEmail = studentData?.email;
  const certNumber = studentData?.student_id ?? null; // Use LDSL/DA/001 style ID as cert number

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  // Insert the certificate record first
  const { data: cert, error: certError } = await admin
    .from("certificates")
    .insert({
      student_id: userId,
      course_id: courseId,
      certificate_number: certNumber,
      status: "active",
    })
    .select("id, student_id, course_id, issued_at, pdf_url, certificate_number, status")
    .single();

  if (certError || !cert)
    return { error: certError?.message ?? "Failed to issue certificate.", status: 500 };

  const certRecord = cert as Certificate & { id: string; issued_at: string };

  // Generate PDF asynchronously (non-blocking for certificate issuance)
  void (async () => {
    try {
      const issuedDate = new Date(certRecord.issued_at).toLocaleDateString("en-NG", {
        day: "numeric", month: "long", year: "numeric",
      });

      const pdfBuffer = await generateCertificatePdf(
        studentName,
        courseData.title,
        courseData.duration ?? null,
        issuedDate,
        certRecord.id,
        certNumber ?? certRecord.id,
        appUrl
      );

      if (pdfBuffer) {
        const filePath = `${userId}/${courseId}.pdf`;
        const { data: uploadData } = await admin.storage
          .from("certificates")
          .upload(filePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

        if (uploadData) {
          const { data: urlData } = admin.storage.from("certificates").getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            await admin.from("certificates").update({ pdf_url: urlData.publicUrl }).eq("id", certRecord.id);
          }
        }
      }
    } catch {
      // PDF generation failure is non-fatal — cert record already persisted
    }
  })();

  // Send certificate email (non-fatal)
  if (studentEmail) {
    try {
      await sendEmail({
        to: studentEmail,
        subject: `Certificate Earned — ${courseData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="${appUrl}/images/logo.png" alt="Lagos Data School" width="150" style="display: inline-block; width: 150px; max-width: 60%; height: auto;" />
              <h1 style="color: #134E4A; margin-top: 20px; font-size: 26px; font-weight: 800;">Congratulations, ${studentName}! 🎉</h1>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              You have successfully completed <strong>${courseData.title}</strong> and earned your verified certificate!
            </p>
            <div style="background: #F0FDFA; border: 2px solid #5EEAD4; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Certificate ID</p>
              <p style="margin: 10px 0 0; font-size: 15px; font-weight: 700; color: #0D9488; font-family: monospace;">${certNumber ?? certRecord.id}</p>
            </div>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Employers can verify your certificate at:<br>
              <a href="${appUrl}/verify/${certRecord.id}" style="color: #0D9488; font-weight: 600;">${appUrl}/verify/${certRecord.id}</a>
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${appUrl}/dashboard/certificates" style="background: #EA580C; color: white; padding: 16px 36px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                View My Certificate →
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e7e9ea; margin: 32px 0;">
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; line-height: 1.6;">
              Lagos Data School Limited — Built in Lagos. Designed for Africa.
            </p>
          </div>
        `,
      });
    } catch {
      // Email failure is non-fatal
    }
  }

  return { data: { certificate: certRecord as Certificate, alreadyExisted: false } };
}
