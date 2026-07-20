import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  /** Kept for call-site compatibility — the image logo has no subtitle text. */
  subtitle?: string | false;
  /** Wrap in a Next.js Link. Defaults to "/". Pass false for no link. */
  href?: string | false;
  /** Kept for call-site compatibility — the logo carries its own white background. */
  onDark?: boolean;
  className?: string;
}

// The official logo file is 1535×1024 (~3:2). Dimensions below preserve that
// ratio while fitting each placement's height/width budget:
//   xs → footer, sm → navbar & page headers, md → dashboard sidebars, lg → login/register
const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 120, height: 80 },
  sm: { width: 75, height: 50 },
  md: { width: 160, height: 107 },
  lg: { width: 200, height: 133 },
};

export function AppLogo({ size = "sm", href = "/", className }: LogoProps) {
  const s = sizeMap[size];

  const inner = (
    <span
      className={cn(
        // White backing keeps the logo legible on dark headers/sidebars and in dark mode
        "inline-flex shrink-0 items-center overflow-hidden rounded-lg bg-white p-0.5",
        className,
      )}
    >
      <Image
        src="/images/logo.png"
        alt="Lagos Data School"
        width={s.width}
        height={s.height}
        className="h-auto w-auto max-w-full"
        priority
      />
    </span>
  );

  if (href === false) return inner;

  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}

/** @deprecated Use AppLogo instead */
export function LdslLogo({ className }: { className?: string }) {
  return <AppLogo size="sm" className={className} />;
}
