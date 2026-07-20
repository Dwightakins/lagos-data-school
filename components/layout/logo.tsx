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
  /** Use on permanently dark surfaces (sidebars, dark headers) — renders the logo in white. */
  onDark?: boolean;
  className?: string;
}

// Transparent logo file is 480×199 (~2.41:1).
//   xs → footer, sm → navbar & page headers, md → dashboard sidebars, lg → login/register
const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 68, height: 28 },
  sm: { width: 82, height: 34 },
  md: { width: 92, height: 38 },
  lg: { width: 125, height: 52 },
};

export function AppLogo({
  size = "sm",
  href = "/",
  onDark = false,
  className,
}: LogoProps) {
  const s = sizeMap[size];

  const inner = (
    <Image
      src="/images/logo.png"
      alt="Lagos Data School"
      width={s.width}
      height={s.height}
      priority
      className={cn(
        "h-auto w-auto max-w-full shrink-0 select-none",
        // Dark navy wordmark is unreadable on dark surfaces — render as white monochrome
        onDark ? "brightness-0 invert" : "dark:brightness-0 dark:invert",
        className,
      )}
    />
  );

  if (href === false) return inner;

  return (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  );
}

/** @deprecated Use AppLogo instead */
export function LdslLogo({ className }: { className?: string }) {
  return <AppLogo size="sm" className={className} />;
}
