import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg";

interface LogoProps {
  size?: LogoSize;
  /** Subtitle text below the name. Defaults to "Limited". Pass false to hide. */
  subtitle?: string | false;
  /** Wrap in a Next.js Link. Defaults to "/". Pass false for no link. */
  href?: string | false;
  /** Use on dark backgrounds — renders name text white instead of foreground. */
  onDark?: boolean;
  className?: string;
}

const sizeMap: Record<LogoSize, { circle: string; initials: string; name: string }> = {
  xs: { circle: "h-8 w-8 text-[7px]",    initials: "LDSL", name: "text-[13px]" },
  sm: { circle: "h-9 w-9 text-[7.5px]",  initials: "LDSL", name: "text-[13px]" },
  md: { circle: "h-10 w-10 text-[8px]",  initials: "LDSL", name: "text-[14px]" },
  lg: { circle: "h-11 w-11 text-[9px]",  initials: "LDSL", name: "text-[17px]" },
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
      {/* Green circle with LDSL */}
      <span
        className={cn(
          "gradient-brand rounded-full grid place-items-center shrink-0",
          s.circle,
        )}
      >
        <span className="font-black text-white tracking-tighter leading-none">
          {s.initials}
        </span>
      </span>

      {/* Text stack */}
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
          <span className="text-[9px] text-brand font-bold tracking-[0.22em] uppercase mt-1.5">
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
