"use client";
import { useCallback, useEffect, useRef } from "react";
import { animate } from "motion/react";
import { cn } from "@/lib/utils";

export function GlowingEffect({
  blur = 0,
  inactiveZone = 0.7,
  proximity = 0,
  spread = 20,
  variant = "default",
  glow = false,
  className,
  movementDuration = 2,
  borderWidth = 1,
  disabled = false,
}: {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  movementDuration?: number;
  borderWidth?: number;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  const handleMove = useCallback(
    (e?: MouseEvent | { x: number; y: number }) => {
      if (!containerRef.current) return;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(() => {
        const element = containerRef.current;
        if (!element) return;
        const { left, top, width, height } = element.getBoundingClientRect();
        const mouseX = e?.x ?? lastPosition.current.x;
        const mouseY = e?.y ?? lastPosition.current.y;
        if (e) lastPosition.current = { x: mouseX, y: mouseY };
        const center = [left + width * 0.5, top + height * 0.5];
        const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
        const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;
        if (distanceFromCenter < inactiveRadius) {
          element.style.setProperty("--active", "0");
          return;
        }
        const isActive =
          mouseX > left - proximity &&
          mouseX < left + width + proximity &&
          mouseY > top - proximity &&
          mouseY < top + height + proximity;
        element.style.setProperty("--active", isActive ? "1" : "0");
        if (!isActive) return;
        const currentAngle = parseFloat(element.style.getPropertyValue("--start")) || 0;
        const targetAngle = (Math.atan2(mouseY - center[1], mouseX - center[0]) * 180) / Math.PI + 90;
        const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
        const newAngle = currentAngle + angleDiff;
        animate(currentAngle, newAngle, {
          duration: movementDuration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (v) => element.style.setProperty("--start", String(v)),
        });
      });
    },
    [inactiveZone, proximity, movementDuration],
  );

  useEffect(() => {
    if (disabled) return;
    const handleScroll = () => handleMove();
    const handlePointer = (e: PointerEvent) => handleMove(e);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("pointermove", handlePointer, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("pointermove", handlePointer);
    };
  }, [handleMove, disabled]);

  return (
    <>
      <div className={cn("pointer-events-none absolute -inset-px hidden rounded-[inherit] border opacity-0 transition-opacity", glow && "opacity-100", variant === "white" && "border-white", disabled && "!block")} />
      <div
        ref={containerRef}
        style={
          {
            "--blur": `${blur}px`,
            "--spread": spread,
            "--start": "0",
            "--active": "0",
            "--glowingeffect-border-width": `${borderWidth}px`,
            "--repeating-conic-gradient-times": "5",
            "--gradient":
              variant === "white"
                ? `repeating-conic-gradient(from 236.84deg at 50% 50%, #fff, #fff calc(25% / var(--repeating-conic-gradient-times)))`
                : `radial-gradient(circle, oklch(0.7 0.18 155) 10%, transparent 20%),
                   radial-gradient(circle at 40% 40%, oklch(0.78 0.13 85) 5%, transparent 15%),
                   radial-gradient(circle at 60% 60%, oklch(0.65 0.2 180) 10%, transparent 20%),
                   radial-gradient(circle at 40% 60%, oklch(0.5 0.18 320) 10%, transparent 20%),
                   repeating-conic-gradient(from 236.84deg at 50% 50%, oklch(0.55 0.18 160) 0%, oklch(0.78 0.13 85) calc(25% / var(--repeating-conic-gradient-times)), oklch(0.5 0.18 25) calc(50% / var(--repeating-conic-gradient-times)), oklch(0.6 0.18 200) calc(75% / var(--repeating-conic-gradient-times)), oklch(0.55 0.18 160) calc(100% / var(--repeating-conic-gradient-times)))`,
          } as React.CSSProperties
        }
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
          glow && "opacity-100",
          blur > 0 && "blur-[var(--blur)]",
          className,
          disabled && "!hidden",
        )}
      >
        <div
          className={cn(
            "glow",
            "rounded-[inherit]",
            "after:content-[''] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))]",
            "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
            "after:[background:var(--gradient)] after:[background-attachment:fixed]",
            "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
            "after:[mask-clip:padding-box,border-box]",
            "after:[mask-composite:intersect]",
            "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]",
          )}
        />
      </div>
    </>
  );
}
