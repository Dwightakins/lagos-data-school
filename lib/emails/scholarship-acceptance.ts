import { sendEmail, SUPPORT_EMAIL } from "@/lib/emails/index";

export interface ScholarshipAcceptanceParams {
  to: string;
  studentName: string;
  courseName: string;
  paymentUrl: string;
}

export interface ScholarshipRejectionParams {
  to: string;
  studentName: string;
  courseName: string;
}

const SCHOLARSHIP_FEE = "₦8,000";

export async function sendScholarshipAcceptanceEmail(
  p: ScholarshipAcceptanceParams,
): Promise<boolean> {
  const paymentUrl = p.paymentUrl;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0a5c4a 0%,#0D9488 100%);padding:40px 40px 36px;text-align:center;">
          <div style="display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.15);border-radius:14px;width:56px;height:56px;margin-bottom:12px;">
            <span style="color:#ffffff;font-weight:900;font-size:15px;letter-spacing:-0.5px;line-height:1;">LD</span>
          </div>
          <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Lagos Data School Limited</p>
          <h1 style="margin:18px 0 8px;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;">
            Your Scholarship Has Been Accepted!
          </h1>
          <p style="margin:0;color:rgba(255,255,255,0.82);font-size:15px;">
            Congratulations, ${p.studentName} 🎉
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 40px;">

          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
            Hi <strong>${p.studentName}</strong>,
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
            We're thrilled to inform you that your scholarship application for
            <strong>${p.courseName}</strong> at Lagos Data School has been
            <span style="color:#0D9488;font-weight:700;">accepted</span>.
            You are one step closer to transforming your career in tech!
          </p>

          <!-- Scholarship Terms Box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1.5px solid #5eead4;border-radius:14px;overflow:hidden;margin-bottom:28px;">
            <tr>
              <td style="padding:20px 24px 16px;">
                <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#0D9488;letter-spacing:2px;text-transform:uppercase;">Scholarship Terms</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td width="28" style="vertical-align:top;padding-top:2px;">
                    <span style="color:#0D9488;font-size:16px;">✓</span>
                  </td>
                  <td style="color:#374151;font-size:14px;line-height:1.6;">
                    <strong>Scholarship fee:</strong> ${SCHOLARSHIP_FEE} (non-refundable) — pay via your unique link
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td width="28" style="vertical-align:top;padding-top:2px;">
                    <span style="color:#0D9488;font-size:16px;">✓</span>
                  </td>
                  <td style="color:#374151;font-size:14px;line-height:1.6;">
                    Full course access — same content as full-pay students
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td width="28" style="vertical-align:top;padding-top:2px;">
                    <span style="color:#0D9488;font-size:16px;">✓</span>
                  </td>
                  <td style="color:#374151;font-size:14px;line-height:1.6;">
                    Verified certificate of completion upon finishing the course
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px 20px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td width="28" style="vertical-align:top;padding-top:2px;">
                    <span style="color:#0D9488;font-size:16px;">✓</span>
                  </td>
                  <td style="color:#374151;font-size:14px;line-height:1.6;">
                    Lifetime access to course materials and alumni network
                  </td>
                </tr></table>
              </td>
            </tr>
          </table>

          <!-- Fee Notice -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:12px;margin-bottom:28px;">
            <tr>
              <td style="padding:18px 24px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#92400e;">
                  Next Step: Pay Your Scholarship Fee
                </p>
                <p style="margin:0;font-size:13.5px;color:#78350f;line-height:1.6;">
                  To secure your spot, pay the <strong>${SCHOLARSHIP_FEE} scholarship fee</strong> using the button below.
                  This fee is non-refundable. Your unique payment link expires in <strong>7 days</strong>.
                  Act now — spots are limited.
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${paymentUrl}"
              style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0a5c4a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;">
              Complete Scholarship Payment →
            </a>
          </div>

          <!-- Support -->
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
            Need help? Contact us at
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#0D9488;font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Lagos Data School Limited — Built in Lagos. Designed for Africa. 🇳🇬</p>
          <p style="margin:0;color:#d1d5db;font-size:11px;">This email was sent to ${p.to}</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  return sendEmail({
    to: p.to,
    subject: "Your Lagos Data School Scholarship Has Been Accepted",
    html,
  });
}

export async function sendScholarshipRejectionEmail(
  p: ScholarshipRejectionParams,
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#374151 0%,#1f2937 100%);padding:40px 40px 36px;text-align:center;">
          <div style="display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);border-radius:14px;width:56px;height:56px;margin-bottom:12px;">
            <span style="color:#ffffff;font-weight:900;font-size:15px;letter-spacing:-0.5px;line-height:1;">LD</span>
          </div>
          <p style="margin:0 0 4px;color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Lagos Data School Limited</p>
          <h1 style="margin:18px 0 8px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;">Scholarship Application Update</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">Hi <strong>${p.studentName}</strong>,</p>
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
            Thank you for applying for a scholarship for <strong>${p.courseName}</strong>.
            After careful review, we are unable to offer you a scholarship at this time.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:12px;margin-bottom:28px;">
            <tr>
              <td style="padding:18px 24px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#92400e;">You can still enrol at full price</p>
                <p style="margin:0;font-size:13.5px;color:#78350f;line-height:1.6;">
                  Invest in your future today. Spots are limited — secure yours before they fill up.
                </p>
              </td>
            </tr>
          </table>
          <div style="text-align:center;margin:28px 0;">
            <a href="${appUrl}/courses"
              style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0a5c4a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;">
              Browse Courses →
            </a>
          </div>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
            Questions? Email us at
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#0D9488;font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Lagos Data School Limited — Built in Lagos. Designed for Africa. 🇳🇬</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return sendEmail({
    to: p.to,
    subject: "Scholarship Application Update — Lagos Data School",
    html,
  });
}
