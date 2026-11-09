import { sendEmail, SUPPORT_EMAIL } from "@/lib/emails/index";

export interface PasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(p: PasswordResetEmailParams): Promise<boolean> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const name = p.name || "there";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background-color:#0D9488;background-image:linear-gradient(135deg,#0a5c4a 0%,#0D9488 100%);padding:36px 40px;text-align:center;">
          <img src="${appUrl}/images/logo.png" alt="Lagos Data School" width="120" style="display:inline-block;width:120px;max-width:50%;height:auto;background:#ffffff;padding:8px 14px;border-radius:12px;margin-bottom:14px;" />
          <h1 style="margin:14px 0 0;color:#ffffff;font-size:26px;font-weight:800;line-height:1.2;">Reset your password</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
            We got a request to reset the password for your Lagos Data School account.
            Tap the button below to choose a new one.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${p.resetUrl}"
              style="display:inline-block;background-color:#0D9488;background-image:linear-gradient(135deg,#0D9488,#0a5c4a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:12px;">
              Choose a New Password →
            </a>
          </div>
          <p style="margin:0 0 24px;color:#6b7280;font-size:12.5px;line-height:1.6;text-align:center;">
            Button not showing? Copy this link into your browser:<br />
            <a href="${p.resetUrl}" style="color:#0D9488;text-decoration:underline;word-break:break-all;">${p.resetUrl}</a>
          </p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.7;">
            The link works for a limited time and can be used once. If you did not ask for this, ignore this email.
            Your password will not change.
          </p>
          <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.7;text-align:center;">
            Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#0D9488;font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Lagos Data School Limited</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return sendEmail({ to: p.to, subject: "Reset your Lagos Data School password", html });
}
