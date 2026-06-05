import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  /** Subtitle text below the name. Defaults to "Limited". Pass false to hide. */
  subtitle?: string | false;
  /** Wrap in a Next.js Link. Defaults to "/". Pass false for no link. */
  href?: string | false;
  /** Force white title text — use on dark/navy/black backgrounds that don't follow the theme. */
  onDark?: boolean;
  className?: string;
}

const sizeMap: Record<LogoSize, { icon: string; initials: string; name: string }> = {
  xs: { icon: "h-8 w-8 rounded-lg text-[11px]",  initials: "LD", name: "text-[14px]" },
  sm: { icon: "h-9 w-9 rounded-xl text-[11px]",  initials: "LD", name: "text-[13px]" },
  md: { icon: "h-10 w-10 rounded-xl text-[12px]", initials: "LD", name: "text-[14px]" },
  lg: { icon: "h-11 w-11 rounded-xl text-[13px]", initials: "LD", name: "text-[17px]" },
};

export function AppLogo({
  size = "xs",
  subtitle = "Limited",
  href = "/",
  onDark = false,
  className,
}: LogoProps) {
  const s = sizeMap[size];

  const inner = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "gradient-brand grid place-items-center shrink-0",
          s.icon,
        )}
      >
        <span className="font-black text-brand-foreground tracking-tight leading-none">
          {s.initials}
        </span>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-bold tracking-tight",
            s.name,
            onDark ? "text-white" : "text-foreground",
          )}
        >
          Lagos Data School
        </span>
        {subtitle !== false && subtitle && (
          <span className="text-[9px] text-brand font-bold tracking-[0.22em] uppercase mt-0.5">
            {subtitle}
          </span>
        )}
      </span>
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
  return <AppLogo className={className} />;
}
