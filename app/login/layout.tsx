import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LdslLogo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Lagos Data School — Sign In",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border">
        <LdslLogo />
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
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
