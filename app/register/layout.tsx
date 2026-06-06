import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppLogo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Lagos Data School — Create Account",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border">
        <AppLogo size="sm" />
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
      <footer className="px-6 py-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lagos Data School Limited
        </p>
      </footer>
    </div>
  );
}
