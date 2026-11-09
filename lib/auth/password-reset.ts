import { createAdminClient } from "@/lib/supabase/admin";
import { findUserIdByEmail } from "@/lib/scholarship/complete-payment";
import { sendPasswordResetEmail } from "@/lib/emails/password-reset";

/**
 * Sends a password reset email through Resend (the same sender as every other LDSL email),
 * so it does not depend on Supabase's built-in mailer or its redirect allow-list.
 *
 * The link opens /reset-password?token_hash=... and the token is only used when the student
 * submits the form, so an email scanner that merely opens the link cannot burn it.
 *
 * Resolves quietly when the email has no account, so the caller never reveals which
 * emails are registered.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return;

  const admin = createAdminClient();
  const userId = await findUserIdByEmail(admin, email);
  if (!userId) return;

  const { data: profile } = await admin
    .from("users")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const p = profile as { full_name: string | null; email: string | null } | null;
  const accountEmail = p?.email || email;

  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: accountEmail,
  });
  const hashed = (link as { properties?: { hashed_token?: string } } | null)?.properties
    ?.hashed_token;
  if (error || !hashed) {
    console.error("[password-reset] generateLink failed:", error?.message);
    return;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const sent = await sendPasswordResetEmail({
    to: accountEmail,
    name: (p?.full_name ?? "").split(" ")[0] || "there",
    resetUrl: `${appUrl}/reset-password?token_hash=${encodeURIComponent(hashed)}`,
  });
  if (!sent) console.error("[password-reset] email failed for", accountEmail);
}
