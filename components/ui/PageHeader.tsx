import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  className?: string;
}

export default function PageHeader({ eyebrow, title, className = "" }: PageHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px w-8 bg-[#1A56DB]" />
        <span className="text-[12px] font-bold text-[#1A56DB] uppercase tracking-[0.22em]">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-serif text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] font-bold text-[#132128] dark:text-white leading-[1.12] tracking-[-0.02em]">
        {title}
      </h2>
    </div>
  );
}
