"use client";

import Link from "next/link";
import { useEffect } from "react";

// Note: error.tsx must be a Client Component — metadata export won't apply here
// but we include it for documentation purposes

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[6rem] font-black text-destructive/10 leading-none select-none">500</p>
        <h1 className="text-[2rem] font-black text-foreground -mt-4 mb-3">Something went wrong</h1>
        <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-bold text-[14px] px-8 py-3 rounded-xl transition-opacity shadow-brand"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-border hover:bg-muted text-foreground font-semibold text-[14px] px-8 py-3 rounded-xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
