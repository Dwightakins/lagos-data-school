"use client";
import { useEffect, useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function ContainerTextFlip({
  words = ["Cloud Computing", "Data Science", "Cybersecurity", "AI Engineering"],
  interval = 2400,
  className,
  textClassName,
}: {
  words?: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
}) {
  const id = useId();
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [interval, words.length]);

  const noAnim = prefersReducedMotion;

  return (
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className={cn(
        "relative inline-flex items-center align-baseline",
        "rounded-2xl px-1 py-0.5",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[index] + id}
          initial={noAnim ? false : { opacity: 0, y: "100%", filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={noAnim ? undefined : { opacity: 0, y: "-100%", filter: "blur(6px)" }}
          transition={noAnim ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={cn("inline-block gradient-text font-display font-bold", textClassName)}
        >
          {words[index].split("").map((ch, i) => (
            <motion.span
              key={i}
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={noAnim ? { duration: 0 } : { delay: i * 0.025, duration: 0.4 }}
              className="inline-block"
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
