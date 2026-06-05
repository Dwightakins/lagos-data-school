"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
};

export function AnimatedTestimonials({
  testimonials,
  autoplay = true,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const handleNext = useCallback(() => setActive((p) => (p + 1) % testimonials.length), [testimonials.length]);
  const handlePrev = () => setActive((p) => (p - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    setReady(true);
    if (!autoplay) return;
    const id = setInterval(handleNext, 6000);
    return () => clearInterval(id);
  }, [autoplay, handleNext]);

  const rotations = [-5, 4, -3, 5];
  const noAnim = prefersReducedMotion;

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-12">
      <div className="relative grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20 items-center">
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {testimonials.map((t, idx) => (
                <motion.div
                  key={t.src}
                  animate={{
                    opacity: ready ? (active === idx ? 1 : 0.55) : 0,
                    scale: ready ? (active === idx ? 1 : 0.94) : 0.92,
                    y: ready ? (active === idx ? 0 : -28) : 60,
                    zIndex: active === idx ? 30 : testimonials.length + 2 - idx,
                    rotate: ready ? (active === idx ? 0 : rotations[idx % rotations.length]) : rotations[idx % rotations.length],
                  }}
                  exit={noAnim ? undefined : { opacity: 0, scale: 0.92, y: 80 }}
                  transition={noAnim ? { duration: 0 } : { duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={t.src}
                    alt={t.name}
                    className="h-full w-full rounded-3xl object-cover object-center shadow-elevated bg-muted"
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col justify-between py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              animate={{ y: 0, opacity: 1 }}
              initial={{ y: 20, opacity: 0 }}
              exit={noAnim ? undefined : { y: -20, opacity: 0 }}
              transition={noAnim ? { duration: 0 } : { duration: 0.3, ease: "easeInOut" }}
            >
              <h3 className="font-display text-2xl font-semibold text-foreground">
                {testimonials[active].name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground font-mono">{testimonials[active].designation}</p>
              <motion.p className="mt-8 text-lg text-foreground/80 leading-relaxed text-balance">
                {testimonials[active].quote.split(" ").map((w, i) => (
                  <motion.span
                    key={i}
                    animate={ready ? { filter: "blur(0px)", opacity: 1, y: 0 } : { filter: "blur(8px)", opacity: 0, y: 5 }}
                    transition={noAnim ? { duration: 0 } : { duration: 0.2, ease: "easeInOut", delay: 0.02 * i }}
                    className="inline-block"
                  >
                    {w}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              onClick={handlePrev}
              className={cn(
                "group/btn flex h-11 w-11 items-center justify-center rounded-full bg-secondary border border-border hover:bg-accent active:bg-accent transition",
              )}
            >
              <ArrowLeft className="h-4 w-4 text-foreground group-hover/btn:-translate-x-0.5 transition" />
            </button>
            <button
              onClick={handleNext}
              className="group/btn flex h-11 w-11 items-center justify-center rounded-full bg-secondary border border-border hover:bg-accent active:bg-accent transition"
            >
              <ArrowRight className="h-4 w-4 text-foreground group-hover/btn:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
