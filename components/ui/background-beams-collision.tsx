"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const beams = [
  { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
  { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
  { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" },
  { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
  { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" },
  { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" },
  { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
];

export function BackgroundBeamsCollision({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={parentRef}
      className={cn(
        "relative flex h-[480px] w-full items-center justify-center overflow-hidden bg-background",
        className,
      )}
    >
      {beams.map((b, i) => (
        <CollisionMechanism key={i} beamOptions={b} containerRef={containerRef} parentRef={parentRef} />
      ))}
      {children}
      <div
        ref={containerRef}
        className="absolute bottom-0 w-full inset-x-0 pointer-events-none"
        style={{
          boxShadow:
            "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset",
        }}
      />
    </div>
  );
}

function CollisionMechanism({
  containerRef,
  parentRef,
  beamOptions,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  parentRef: React.RefObject<HTMLDivElement | null>;
  beamOptions: any;
}) {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{ detected: boolean; coordinates: { x: number; y: number } | null }>({
    detected: false,
    coordinates: null,
  });
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const check = () => {
      if (beamRef.current && containerRef.current && parentRef.current && !collision.detected) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();
        if (beamRect.bottom >= containerRect.top) {
          const relX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relY = beamRect.bottom - parentRect.top;
          setCollision({ detected: true, coordinates: { x: relX, y: relY } });
        }
      }
    };
    const id = setInterval(check, 50);
    return () => clearInterval(id);
  }, [collision.detected, containerRef, parentRef]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      const t1 = setTimeout(() => setCollision({ detected: false, coordinates: null }), 2000);
      const t2 = setTimeout(() => setCycle((c) => c + 1), 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={cycle + (beamOptions.initialX ?? 0)}
        ref={beamRef}
        animate="animate"
        initial={{ translateY: beamOptions.initialY || "-200px", translateX: beamOptions.initialX || "0px", rotate: 0 }}
        variants={{
          animate: {
            translateY: beamOptions.translateY || "1800px",
            translateX: beamOptions.translateX || "0px",
            rotate: 0,
          },
        }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beamOptions.delay || 0,
          repeatDelay: beamOptions.repeatDelay || 0,
        }}
        className={cn(
          "absolute left-0 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-brand via-brand-glow to-transparent",
          beamOptions.className,
        )}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            style={{ left: `${collision.coordinates.x}px`, top: `${collision.coordinates.y}px` }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Explosion({ style }: { style?: React.CSSProperties }) {
  const spans = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));
  return (
    <div style={style} className="absolute z-50 h-2 w-2">
      <motion.div
        initial={{ opacity: 0.7, scale: 0 }}
        animate={{ opacity: 1, scale: 1.5 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-brand-glow to-transparent blur-sm"
      />
      {spans.map((s) => (
        <motion.span
          key={s.id}
          initial={{ x: s.initialX, y: s.initialY, opacity: 1 }}
          animate={{ x: s.directionX, y: s.directionY, opacity: 0 }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-brand to-brand-glow"
        />
      ))}
    </div>
  );
}
