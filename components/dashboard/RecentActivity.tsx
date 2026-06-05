import type { ActivityItem } from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <section>
      <h2 className="text-[1.15rem] font-bold text-[#0f172a] mb-5">Recent Activity</h2>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {items.length === 0 ? (
          <div className="py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <span className="text-3xl leading-none">📋</span>
            </div>
            <p className="text-[14px] font-medium text-slate-500">No activity yet. Start learning today!</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-[#0f172a] truncate">{item.lessonTitle}</p>
                  <p className="text-[12px] text-slate-400 truncate">{item.courseName}</p>
                </div>
                <span className="text-[11.5px] text-slate-400 shrink-0 font-medium tabular-nums">
                  {formatDate(item.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
