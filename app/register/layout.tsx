import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Lagos Data School — Create Account",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4"
      style={{
        backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="w-full max-w-[480px]">{children}</div>
    </div>
  );
}
