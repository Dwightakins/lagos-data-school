import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? "Lagos Data School <onboarding@resend.dev>";

export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ?? "support@lagosdataschoolltd.com";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/** Send an email via Resend. Returns true on success, false on failure (non-throwing). */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  if (!opts.to) return false;
  try {
    const { error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] sendEmail threw:", err);
    return false;
  }
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}
