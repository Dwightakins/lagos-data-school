"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PointerHighlight({
  children,
  className,
  rectangleClassName,
  pointerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  rectangleClassName?: string;
  pointerClassName?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(() => {
      if (ref.current) setDim({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      {children}
      {dim.w > 0 && (
        <motion.div
          initial={{ opacity: 0, width: 0, height: 0 }}
          whileInView={{ opacity: 1, width: dim.w + 8, height: dim.h + 6 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.05 }}
          className={cn(
            "absolute -left-1 -top-0.5 pointer-events-none border-2 border-brand rounded-md",
            rectangleClassName,
          )}
        />
      )}
      {dim.w > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 0, y: 0 }}
          whileInView={{ opacity: 1, x: dim.w - 6, y: dim.h - 4 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.05 }}
          className={cn("absolute left-0 top-0 pointer-events-none text-brand", pointerClassName)}
        >
          <MousePointer2 className="h-4 w-4 fill-brand" />
        </motion.div>
      )}
    </span>
  );
}
