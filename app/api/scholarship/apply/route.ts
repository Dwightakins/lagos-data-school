import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  let body: { courseId?: string; name?: string; email?: string; phone?: string; essay?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const courseId = body.courseId?.trim();
  const name     = body.name?.trim() ?? "";
  const email    = body.email?.trim() ?? "";
  const phone    = body.phone?.trim() ?? "";
  const essay    = body.essay?.trim() ?? "";

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!courseId)               return NextResponse.json({ error: "Please select a course." }, { status: 400 });
  if (!UUID_RE.test(courseId)) return NextResponse.json({ error: "Invalid course selection." }, { status: 400 });
  if (!name)              return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  if (!email)             return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (essay.length < 100) return NextResponse.json({ error: "Essay must be at least 100 characters." }, { status: 400 });

  const admin = createAdminClient();

  // Try to look up the course title — query by id only (no published filter to avoid column name mismatch)
  const { data: courseRow } = await admin
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .maybeSingle();

  // Use DB title if found, otherwise use the courseId as a human-readable fallback
  const courseTitle = (courseRow as { id: string; title: string } | null)?.title ?? courseId;

  // Block duplicate applications for the same email + course
  const { data: existing } = await admin
    .from("scholarship_applications")
    .select("id, status")
    .eq("applicant_email", email)
    .eq("course_id", courseId)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An application for this course already exists with this email." },
      { status: 409 }
    );
  }

  const { error: insertError } = await admin.from("scholarship_applications").insert({
    user_id:         null,
    course_id:       courseId,
    course_name:     courseTitle,
    status:          "pending",
    applicant_name:  name,
    applicant_email: email,
    applicant_phone: phone,
    essay,
  });

  if (insertError) {
    console.error("[scholarship/apply] insert error:", insertError);
    return NextResponse.json({ error: "Failed to submit application. Please try again." }, { status: 500 });
  }

  // Send confirmation email — non-blocking, failure doesn't affect response
  const appliedDate = new Date().toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  void sendEmail({
    to: email,
    subject: "LDSL Scholarship Application Received",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdfa;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #e2f5f1;">
        <tr>
          <td style="background:#134E4A;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;background:#0D9488;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                <span style="color:#fff;font-weight:900;font-size:10px;letter-spacing:0.05em;">LDSL</span>
              </div>
              <div style="text-align:left;">
                <div style="color:#ffffff;font-weight:700;font-size:15px;">Lagos Data School</div>
                <div style="color:#2DD4BF;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Limited</div>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#134E4A;">Application Received!</h1>
            <p style="margin:0 0 24px;color:#64748B;font-size:14px;">We've got your scholarship application and are excited to review it.</p>
            <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.7;">
              Hi <strong>${name}</strong>,<br><br>
              Thank you for applying for the Lagos Data School scholarship!<br><br>
              We have received your application and will review it within <strong>48 hours</strong>.
              You'll receive an email notification once we've made a decision.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1px solid #a7f3d0;border-radius:12px;padding:20px;margin-bottom:24px;">
              <tr><td>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#64748B;font-size:13px;width:150px;">Course Applied For</td>
                    <td style="padding:6px 0;color:#134E4A;font-size:13px;font-weight:700;">${courseTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748B;font-size:13px;">Application Date</td>
                    <td style="padding:6px 0;color:#134E4A;font-size:13px;font-weight:700;">${appliedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748B;font-size:13px;">Applicant</td>
                    <td style="padding:6px 0;color:#134E4A;font-size:13px;font-weight:700;">${name}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 28px;font-size:14px;color:#64748B;line-height:1.7;">
              Questions? Reach us at
              <a href="mailto:hello@lagosdataschool.com" style="color:#0D9488;font-weight:600;">hello@lagosdataschool.com</a>.
            </p>
            <a href="https://lagosdataschool.com/courses" style="display:inline-block;background:#0D9488;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;border-radius:10px;text-decoration:none;">
              Browse Courses →
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e7e9ea;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;color:#64748B;font-size:12px;">Best regards,</p>
            <p style="margin:0 0 12px;color:#134E4A;font-size:13px;font-weight:700;">Lagos Data School Team</p>
            <p style="margin:0;color:#94A3B8;font-size:11px;">
              <a href="https://lagosdataschool.com" style="color:#0D9488;">lagosdataschool.com</a>
              &nbsp;·&nbsp;
              <a href="mailto:hello@lagosdataschool.com" style="color:#0D9488;">hello@lagosdataschool.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  return NextResponse.json({ success: true });
}
