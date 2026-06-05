"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyResponse = {
  success: boolean;
  error?: string;
  retryable?: boolean;
};

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get("reference");
        const userId = searchParams.get("userId");
        const fullName = searchParams.get("fullName");
        const courseId = searchParams.get("courseId");
        const courseName = searchParams.get("courseName");
        const paymentType = searchParams.get("paymentType");

        if (!reference) {
          setMessage("Missing payment reference");
          return;
        }

        let data: VerifyResponse = {
          success: false,
          error: "Verification failed",
        };

        for (let attempt = 1; attempt <= 5; attempt += 1) {
          setMessage(attempt === 1 ? "Verifying payment..." : "Still confirming payment...");

          const response = await fetch("/api/paystack/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference,
              userId,
              fullName,
              courseId,
              courseName,
              paymentType,
            }),
          });

          data = (await response.json()) as VerifyResponse;

          if (data.success || !data.retryable) break;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (data.success) {
          localStorage.removeItem("lds-pending-payment");
          setMessage("Payment verified");

          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } else {
          setMessage(data.error ?? "Verification failed");
        }
      } catch (error) {
        console.error(error);

        setMessage("Something went wrong");
      }
    };

    verifyPayment();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-6">
          {message === "Payment verified" ? (
            <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <h1 className="text-[1.5rem] font-black text-foreground mb-2">{message}</h1>
        <p className="text-[14px] text-muted-foreground">
          {message === "Payment verified"
            ? "Redirecting you to login..."
            : "Please wait while we confirm your payment."}
        </p>
      </div>
    </div>
  );
}
