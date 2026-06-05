"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { MovingBorderButton } from "@/components/ui/moving-border-button";

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const dur = (d: number, del?: number) =>
    prefersReducedMotion ? { duration: 0 } : { duration: d, ...(del ? { delay: del } : {}) };

  return (
    <section className="relative isolate overflow-hidden pt-8 pb-16 sm:pt-16 md:pt-32 md:pb-32 bg-background">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="oklch(0.72 0.16 155 / 0.4)" />
      <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark mask-radial-fade opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={dur(0.6)}
          className="mx-auto mb-6 inline-flex w-full justify-center"
        >
          <a href="#" className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/50 backdrop-blur px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
              <Sparkles className="h-3 w-3" /> New
            </span>
            Cohort 4 applications now open — limited seats
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.h1
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={dur(0.7, 0.05)}
              className="font-display text-4xl sm:text-6xl lg:text-[5rem] leading-[0.98] font-bold tracking-tight text-foreground text-balance"
            >
              Raising the Next Generation of <br className="hidden sm:block" />
              {" "}
              leaders in{" "}
              <ContainerTextFlip
                words={["Cloud Computing", "Data Science", "Cybersecurity", "AI Engineering", "Product Design"]}
                textClassName="text-4xl sm:text-6xl lg:text-[5rem] leading-[0.98]"
              />
            </motion.h1>

            <motion.p
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={dur(0.6, 0.18)}
              className="mt-7 max-w-xl lg:mx-0 mx-auto text-lg text-muted-foreground leading-relaxed"
            >
              Lagos Data School trains the next generation of Nigerian engineers, designers and data scientists. Live cohorts, real projects, verified certificates and job placement.
            </motion.p>

            <motion.div
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={dur(0.6, 0.28)}
              className="mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <MovingBorderButton
                as="a"
                href="/register"
                borderRadius="0.85rem"
                transparent
                className="!px-7 !py-3.5 gap-2 text-foreground"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </MovingBorderButton>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-[0.85rem] border border-border/70 bg-background/60 backdrop-blur px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition"
              >
                <PlayCircle className="h-4 w-4" />
                View courses
              </Link>
            </motion.div>

            <motion.div
              animate={ready ? { opacity: 1 } : { opacity: 0 }}
              transition={dur(0.8, 0.5)}
              className="mt-12 grid grid-cols-2 max-w-md mx-auto lg:mx-0 gap-6"
            >
              {[
                { v: "2,000+", l: "Students trained" },
                { v: "87%", l: "Placement rate" },
              ].map((s) => (
                <div key={s.l} className="border-l border-border pl-4 text-left">
                  <div className="font-display text-2xl font-bold text-foreground">{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            animate={ready ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 0, y: 30, rotate: -2 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="animate-float relative rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl p-2 shadow-elevated">
              <div className="absolute -top-3 left-6 right-6 h-3 rounded-t-xl bg-gradient-to-r from-brand via-brand-glow to-gold opacity-60 blur-md" />
              <img
                src="/images/hero.jpg"
                width={1280}
                height={896}
                alt="LDSL learning platform"
                className="w-full rounded-2xl"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const placeholder = img.nextElementSibling as HTMLElement | null;
                  if (placeholder) placeholder.style.display = "flex";
                }}
              />
              <div className="hidden w-full rounded-2xl bg-gradient-to-br from-brand/20 to-brand-glow/20 items-center justify-center" style={{ aspectRatio: "16/9" }}>
                <span className="text-brand font-bold text-lg">Lagos Data School</span>
              </div>
              <div className="absolute -bottom-5 -left-5 rounded-2xl border border-border/70 bg-background/90 backdrop-blur p-3 shadow-elevated hidden sm:block">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-xs">
                    <div className="font-semibold text-foreground">Live class in session</div>
                    <div className="text-muted-foreground"></div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-4 rounded-xl border border-border/70 bg-background/90 backdrop-blur px-3 py-2 shadow-elevated hidden sm:block">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Cohort 4</div>
                <div className="text-sm font-display font-bold text-foreground"></div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
