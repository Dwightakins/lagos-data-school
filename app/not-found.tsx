import Link from "next/link";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — Lagos Data School Limited",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ResizableNavbar />
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <p className="text-[7rem] font-black text-brand/10 leading-none select-none">404</p>
          <h1 className="text-[2rem] font-black text-foreground -mt-4 mb-3">Page not found</h1>
          <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-bold text-[14px] px-8 py-3 rounded-xl transition-opacity shadow-brand"
            >
              Go Home
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 border border-border hover:bg-muted text-foreground font-semibold text-[14px] px-8 py-3 rounded-xl transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
}
