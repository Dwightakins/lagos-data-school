"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function BackButton({ label = "Back", className, iconClassName }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn("inline-flex items-center gap-1.5 transition-colors", className)}
    >
      <ArrowLeft className={iconClassName ?? "w-3.5 h-3.5"} />
      {label}
    </button>
  );
}
