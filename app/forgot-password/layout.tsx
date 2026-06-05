import type { Metadata } from "next";
import type { ReactNode } from "react";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

export const metadata: Metadata = {
  title: "Lagos Data School — Forgot Password",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen bg-[#F0F4F8] dark:bg-[#0a0f1a] flex items-center justify-center p-4"
      style={{
        backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <div className="w-full max-w-[480px]">{children}</div>
    </div>
  );
}
