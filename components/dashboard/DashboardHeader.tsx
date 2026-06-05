import { Bell } from "lucide-react";

interface DashboardHeaderProps {
  greeting: string;
  firstName: string;
  today: string;
}

export default function DashboardHeader({ greeting, firstName, today }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-[1.75rem] font-bold text-[#0f172a] leading-tight tracking-tight">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-[14px] text-slate-500 mt-1">Here&apos;s what&apos;s happening with your learning today.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-slate-500 font-medium hidden sm:block">{today}</span>
        <button
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-[#1A56DB] hover:text-[#1A56DB] text-slate-400 transition-all shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
}
