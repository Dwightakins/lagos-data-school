"use client";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { BackgroundBeamsCollision } from "@/components/ui/background-beams-collision";
import { Noise } from "@/components/ui/noise";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";

export function CtaBannerSection() {
  const enrollment = useEnrollmentStatus();
  return (
    <section className="relative py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <BackgroundBeamsCollision className="rounded-2xl sm:rounded-3xl border border-border/70 min-h-[380px] sm:h-[520px] bg-secondary/40 overflow-hidden py-16 sm:py-0">
          <div className="relative z-10 mx-auto max-w-3xl text-center px-6">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand"   >Cohort 14</div>
            <h2 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground text-balance">
              Your tech career in Africa <br className="hidden sm:block" />
              starts in Lagos.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Application now open.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              {enrollment === "enrolled" ? (
                <a
                  href="/dashboard"
                  className="relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl gradient-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground shadow-brand hover:opacity-95 transition"
                >
                  <Noise className="opacity-40" />
                  <LayoutDashboard className="relative h-4 w-4" />
                  <span className="relative">Go to Dashboard</span>
                </a>
              ) : (
                <a
                  href="/register"
                  className="relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl gradient-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground shadow-brand hover:opacity-95 transition"
                >
                  <Noise className="opacity-40" />
                  <span className="relative">Apply now</span>
                  <ArrowRight className="relative h-4 w-4" />
                </a>
              )}
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/70 backdrop-blur px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition"
              >
                Talk to admissions
              </a>
            </div>
          </div>
        </BackgroundBeamsCollision>
      </div>
    </section>
  );
}
