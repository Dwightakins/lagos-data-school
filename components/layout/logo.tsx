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
  /** Use on `bg-foreground` surfaces (sidebars, dark headers, footer). */
  onDark?: boolean;
  className?: string;
}

// Responsive display widths (height follows the file's ~2.41:1 ratio via h-auto).
//   xs → footer, sm → navbar & page headers, md → dashboard sidebars, lg → login/register
const sizeMap: Record<LogoSize, string> = {
  xs: "w-[100px] md:w-[120px]",
  sm: "w-[120px] md:w-[140px] lg:w-[160px]",
  md: "w-[120px] md:w-[140px] lg:w-[160px]",
  lg: "w-[160px] md:w-[180px] lg:w-[200px]",
};

export function AppLogo({
  size = "sm",
  href = "/",
  onDark = false,
  className,
}: LogoProps) {
  const inner = (
    <Image
      src="/images/logo.png"
      alt="Lagos Data School"
      width={480}
      height={199}
      priority
      className={cn(
        "h-auto max-w-full shrink-0 select-none",
        sizeMap[size],
        // `bg-foreground` surfaces are dark in light theme (white logo needed) but
        // flip to near-white in dark theme (full-colour logo reads fine there).
        // Plain surfaces are the opposite: dark theme needs the white version.
        onDark
          ? "brightness-0 invert dark:brightness-100 dark:invert-0"
          : "dark:brightness-0 dark:invert",
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
