"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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
  const prefersReducedMotion = useReducedMotion();
  const handleNext = useCallback(
    () => setActive((p) => (p + 1) % testimonials.length),
    [testimonials.length],
  );
  const handlePrev = () =>
    setActive((p) => (p - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(handleNext, 6000);
    return () => clearInterval(id);
  }, [autoplay, handleNext]);

  // Preload all testimonial images so transitions don't wait on network
  useEffect(() => {
    testimonials.forEach((t) => {
      const img = new window.Image();
      img.src = t.src;
    });
  }, [testimonials]);

  const rotations = [-5, 4, -3, 5];
  const duration = prefersReducedMotion ? 0 : 0.25;

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 py-12">
      <div className="relative grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20 items-center">

        {/* Image stack */}
        <div>
          <div className="relative h-80 w-full">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.src}
                animate={{
                  opacity: active === idx ? 1 : 0.45,
                  rotate: active === idx ? 0 : rotations[idx % rotations.length],
                  zIndex: active === idx ? 30 : testimonials.length + 2 - idx,
                }}
                transition={{ duration, ease: "easeOut" }}
                className="absolute inset-0 origin-bottom"
              >
                <Image
                  src={t.src}
                  alt={t.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="rounded-3xl object-cover object-center shadow-elevated bg-muted"
                  loading={idx === 0 ? "eager" : "lazy"}
                  draggable={false}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Text content */}
        <div className="flex flex-col justify-between py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration, ease: "easeOut" }}
            >
              <h3 className="font-display text-2xl font-semibold text-foreground">
                {testimonials[active].name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground font-mono">
                {testimonials[active].designation}
              </p>
              <p className="mt-8 text-lg text-foreground/80 leading-relaxed text-balance">
                {testimonials[active].quote}
              </p>
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
