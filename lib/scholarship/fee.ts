import { PAYMENT_CONFIG } from "@/lib/payment-config";

/**
 * The scholarship fee for one application.
 *
 * Normally PAYMENT_CONFIG.scholarshipFee. For admin testing only, two SERVER env vars
 * can lower it for specific emails (the browser can never set these):
 *   SCHOLARSHIP_TEST_EMAILS=you@example.com,other@example.com
 *   SCHOLARSHIP_TEST_FEE=100
 * Everyone not on that list always pays the normal fee.
 */
export function getScholarshipFee(applicantEmail: string | null | undefined): number {
  const email = (applicantEmail ?? "").trim().toLowerCase();
  const testFee = Number(process.env.SCHOLARSHIP_TEST_FEE);
  const testEmails = (process.env.SCHOLARSHIP_TEST_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (email && Number.isFinite(testFee) && testFee > 0 && testEmails.includes(email)) {
    return testFee;
  }
  return PAYMENT_CONFIG.scholarshipFee;
}
