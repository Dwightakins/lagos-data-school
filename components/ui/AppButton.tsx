import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "success" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#1A56DB] hover:bg-[#1547BA] text-white shadow-sm shadow-[#1A56DB]/20",
  secondary:
    "bg-[#132128] hover:bg-[#1e3036] text-white",
  success:
    "bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md shadow-[#16A34A]/20",
  outline:
    "border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151]",
  ghost:
    "text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB]",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-[13px] px-4 py-2 rounded-lg",
  md: "text-[14px] px-5 py-2.5 rounded-lg",
  lg: "text-[15px] px-8 py-3.5 rounded-xl",
};

export default function AppButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-bold transition-colors",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
    >
      {children}
    </button>
  );
}
