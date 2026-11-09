import { NextRequest, NextResponse } from "next/server";
import { completeScholarshipPayment } from "@/lib/scholarship/complete-payment";

export async function POST(req: NextRequest) {
  let body: { token?: string; transactionId?: string; reference?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = body.token?.trim();
  // `transactionId` is the id ALATPay returns from the popup. `reference` is accepted
  // for older cached copies of the payment page.
  const transactionId = (body.transactionId ?? body.reference)?.trim();

  if (!token || !transactionId) {
    return NextResponse.json({ error: "Missing token or transaction id." }, { status: 400 });
  }

  try {
    const result = await completeScholarshipPayment(token, transactionId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      success: true,
      studentId: result.studentId,
      newAccount: result.newAccount,
    });
  } catch (err) {
    console.error("[scholarship/complete-payment]", err);
    return NextResponse.json(
      { error: "Something went wrong confirming your payment. Please contact support." },
      { status: 500 },
    );
  }
}
