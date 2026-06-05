"use client";
import { useRef } from "react";
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export function MovingBorderButton({
  children,
  borderRadius = "1rem",
  duration = 3500,
  className,
  containerClassName,
  borderClassName,
  as: Tag = "button",
  transparent = false,
  ...props
}: {
  children: React.ReactNode;
  borderRadius?: string;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  transparent?: boolean;
  as?: React.ElementType;
} & React.ComponentPropsWithoutRef<"a"> & React.ComponentPropsWithoutRef<"button">) {
  return (
    <Tag
      {...props}
      className={cn(
        "relative overflow-hidden p-[1.5px] inline-block",
        containerClassName,
      )}
      style={{ borderRadius }}
    >
      <div className="absolute inset-0" style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}>
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "h-24 w-24 opacity-90",
              "bg-[radial-gradient(circle,var(--brand-glow)_30%,transparent_70%)]",
              borderClassName,
            )}
          />
        </MovingBorder>
      </div>
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center antialiased",
          "px-6 py-3 text-sm font-semibold backdrop-blur-xl border border-border/60",
          transparent
            ? "bg-transparent text-foreground"
            : "bg-foreground text-background",
          className,
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </div>
    </Tag>
  );
}

function MovingBorder({
  children,
  duration = 3000,
  rx,
  ry,
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement | null>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMs = length / duration;
      progress.set((time * pxPerMs) % length);
    }
  });

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x ?? 0);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg className="absolute h-full w-full" width="100%" height="100%" preserveAspectRatio="none">
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}>
        {children}
      </motion.div>
    </>
  );
}
