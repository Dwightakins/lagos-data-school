import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  header,
  icon,
  title,
  description,
}: {
  className?: string;
  header?: ReactNode;
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "row-span-1 rounded-2xl border border-transparent p-4 flex flex-col gap-3 transition-all duration-200",
        className
      )}
    >
      {header}
      <div className="flex flex-col gap-1 flex-1">
        {icon && <div>{icon}</div>}
        {title && <div className="font-semibold text-sm">{title}</div>}
        {description && <div className="text-xs leading-relaxed">{description}</div>}
      </div>
    </div>
  );
}
