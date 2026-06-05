"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface Step4Props {
  email: string;
  payType: "full" | "scholarship";
  courseName?: string;
  onDone?: () => void;
}

export default function Step4Verify({ email, payType, courseName, onDone }: Step4Props) {
  const router = useRouter();

  function handleLogin() {
    onDone?.();
    router.push("/login");
  }

  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="w-16 h-16 rounded-full bg-brand/10 border-2 border-brand/30 flex items-center justify-center mb-5">
        <CheckCircle2 className="w-8 h-8 text-brand" />
      </div>

      <h2 className="text-[1.4rem] font-bold text-foreground mb-3">Payment Confirmed!</h2>

      {courseName && (
        <p className="text-[13px] font-semibold text-brand mb-2">{courseName}</p>
      )}

      <p className="text-[13.5px] text-foreground mb-1 leading-relaxed">
        {payType === "full"
          ? "Your payment has been received and verified."
          : "Your ₦15,000 scholarship fee has been confirmed. You now have full access to your course."}
      </p>

      <p className="text-[13.5px] text-muted-foreground mb-6 leading-relaxed">
        Check your email at{" "}
        <span className="font-semibold text-foreground">{email}</span>{" "}
        for your login details and confirmation.
      </p>

      <button
        onClick={handleLogin}
        className="w-full bg-brand hover:opacity-90 text-brand-foreground font-bold text-[14.5px] py-3.5 rounded-xl transition-opacity shadow-brand text-center"
      >
        Login to Dashboard
      </button>
    </div>
  );
}
