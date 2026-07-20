import { sendEmail, formatNaira, SUPPORT_EMAIL } from "@/lib/emails/index";

export interface OnboardingEmailParams {
  to: string;
  studentName: string;
  courseName: string;
  amountPaid: number;         // Naira
  paymentType: "full" | "scholarship" | string;
  orderId: string;            // payment reference e.g. LDS-1748123-abc123
  studentId: string | null;   // e.g. LDSL/DA/001
  enrolledAt: string;         // ISO date string
  dashboardUrl: string;
}

export async function sendOnboardingEmail(p: OnboardingEmailParams): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const date = new Date(p.enrolledAt).toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const paymentLabel = p.paymentType === "scholarship" ? "Scholarship" : "Full Pay";

  const subject = `Welcome to ${p.courseName} — Your Access is Ready`;

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
          <img src="${appUrl}/images/logo.png" alt="Lagos Data School" width="120" style="display:inline-block;width:120px;max-width:50%;height:auto;background:#ffffff;padding:8px 14px;border-radius:12px;margin-bottom:14px;" />
          <h1 style="margin:18px 0 8px;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;">
            Welcome, ${p.studentName}!
          </h1>
          <p style="margin:0;color:rgba(255,255,255,0.82);font-size:15px;line-height:1.5;">
            Your enrollment is confirmed. Start learning today.
          </p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 40px;">

          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
            Hi <strong>${p.studentName}</strong>, you're officially enrolled in
            <strong>${p.courseName}</strong>. Your course access is live — log in to your
            dashboard and start your first lesson now.
          </p>

          <!-- Enrollment Summary -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border:1.5px solid #5eead4;border-radius:14px;overflow:hidden;margin-bottom:28px;">
            <tr>
              <td style="padding:20px 24px 16px;">
                <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#0D9488;letter-spacing:2px;text-transform:uppercase;">Enrollment Summary</p>
              </td>
            </tr>
            ${p.studentId ? `
            <tr>
              <td style="padding:10px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Student ID</td>
                  <td style="text-align:right;color:#0D9488;font-size:14px;font-weight:800;font-family:monospace,monospace;">${p.studentId}</td>
                </tr></table>
              </td>
            </tr>` : ""}
            <tr>
              <td style="padding:10px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Order ID</td>
                  <td style="text-align:right;color:#111827;font-size:13px;font-weight:700;font-family:monospace,monospace;">${p.orderId}</td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Course</td>
                  <td style="text-align:right;color:#111827;font-size:13px;font-weight:700;">${p.courseName}</td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Amount Paid</td>
                  <td style="text-align:right;color:#111827;font-size:14px;font-weight:800;">${formatNaira(p.amountPaid)}</td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Payment Method</td>
                  <td style="text-align:right;">
                    <span style="background:${p.paymentType === "scholarship" ? "#f3f4f6" : "#f0fdfa"};color:${p.paymentType === "scholarship" ? "#6b7280" : "#0D9488"};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${paymentLabel}</span>
                  </td>
                </tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px 20px;border-top:1px solid #ccfbf1;">
                <table width="100%"><tr>
                  <td style="color:#6b7280;font-size:13px;font-weight:600;">Date</td>
                  <td style="text-align:right;color:#111827;font-size:13px;font-weight:600;">${date}</td>
                </tr></table>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin:32px 0;">
            <a href="${p.dashboardUrl}"
              style="display:inline-block;background:linear-gradient(135deg,#0D9488,#0a5c4a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.2px;">
              Log in to Your Dashboard →
            </a>
          </div>

          <!-- What's Next -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:28px;">
            <tr><td style="padding:18px 24px 14px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">What's Next</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 12px 6px 0;vertical-align:top;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;background:#0D9488;color:#fff;border-radius:50%;width:22px;height:22px;font-size:11px;font-weight:800;">1</span>
                  </td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">Log in to your student dashboard</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px 6px 0;vertical-align:top;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;background:#0D9488;color:#fff;border-radius:50%;width:22px;height:22px;font-size:11px;font-weight:800;">2</span>
                  </td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">Access your course materials and lessons</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px 6px 0;vertical-align:top;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;background:#0D9488;color:#fff;border-radius:50%;width:22px;height:22px;font-size:11px;font-weight:800;">3</span>
                  </td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">Complete lessons at your own pace</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px 6px 0;vertical-align:top;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;background:#0D9488;color:#fff;border-radius:50%;width:22px;height:22px;font-size:11px;font-weight:800;">4</span>
                  </td>
                  <td style="padding:6px 0;color:#374151;font-size:14px;line-height:1.5;">Sit your final exam and earn your certificate</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Support -->
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
            Questions? Email us at
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#0D9488;font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
            or visit <a href="${appUrl}/contact" style="color:#0D9488;font-weight:600;text-decoration:none;">our help center</a>.
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

  return sendEmail({ to: p.to, subject, html });
}
