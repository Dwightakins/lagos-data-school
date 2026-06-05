"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const paths = [
  "M720 450C720 450 742.459 440.315 755.249 425.626C768.039 410.937 778.88 418.741 789.86 410.272C800.84 401.803 817.346 397.629 826.879 392.295C836.413 386.961 843.208 386.395 856.6 389.072C869.992 391.749 877.376 374.683 894.103 365.929C910.831 357.176 923.279 351.969 933.39 346.78C943.502 341.591 953.286 338.121 961.987 333.448C970.687 328.776 980.116 325.105 989.494 318.566",
  "M720 450C720 450 741.822 435.243 753.752 427.819C765.683 420.395 778.802 425.391 794.058 418.752C809.313 412.114 819.193 410.117 828.075 402.456C836.956 394.795 845.385 392.156 853.766 388.518C862.146 384.881 873.96 379.157 884.183 372.74C894.405 366.323 904.07 365.213 916.06 358.391",
  "M720 450C720 450 738.336 435.987 752.973 430.349C767.61 424.711 778.629 422.836 791.526 417.871C804.422 412.906 813.319 411.077 825.521 405.252C837.722 399.426 848.792 395.211 858.917 391.21C869.041 387.21 881.078 383.012 892.295 378.001",
  "M720 450C720 450 734.336 437.847 748.973 432.209C763.61 426.571 774.629 422.696 787.526 417.731C800.422 412.766 809.319 410.937 821.521 405.111C833.722 399.286 844.792 395.071 854.917 391.07",
  "M720 450C720 450 742.459 440.315 755.249 425.626C768.039 410.937 778.88 418.741 789.86 410.272",
];

export function BackgroundLines({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <SVG />
      {children}
    </div>
  );
}

function SVG() {
  return (
    <motion.svg
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full mask-radial-fade opacity-50 dark:opacity-30 pointer-events-none"
    >
      {[...paths, ...paths].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={`oklch(0.6 0.18 ${140 + (i * 20) % 80})`}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0.6] }}
          transition={{ duration: 6 + (i % 4), repeat: Infinity, repeatType: "loop", delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}
      <g transform="translate(-300, -120)">
        {[...paths, ...paths].map((d, i) => (
          <motion.path
            key={"a" + i}
            d={d}
            stroke={`oklch(0.7 0.16 ${100 + (i * 15) % 80})`}
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.8, 0.3] }}
            transition={{ duration: 7 + (i % 5), repeat: Infinity, repeatType: "loop", delay: i * 0.5 + 1, ease: "easeInOut" }}
          />
        ))}
      </g>
    </motion.svg>
  );
}
