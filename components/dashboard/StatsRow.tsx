type StatColor = "blue" | "green" | "orange" | "gold";

interface StatCardProps {
  label: string;
  value: number;
  emoji: string;
  color: StatColor;
  trend?: string;
}

const colorStyles: Record<StatColor, { bg: string; border: string; dot: string }> = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-100",   dot: "bg-blue-500"   },
  green:  { bg: "bg-emerald-50",border: "border-emerald-100",dot: "bg-emerald-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-100", dot: "bg-orange-500"  },
  gold:   { bg: "bg-amber-50",  border: "border-amber-100",  dot: "bg-amber-500"   },
};

function StatCard({ label, value, emoji, color, trend }: StatCardProps) {
  const s = colorStyles[color];
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center`}>
          <span className="text-[20px] leading-none">{emoji}</span>
        </div>
        {trend && (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[36px] font-bold text-[#0f172a] leading-none tracking-tight">{value}</p>
      <p className="text-[13px] text-slate-500 mt-2 font-medium">{label}</p>
      <div className={`mt-3 h-0.5 w-8 rounded-full ${s.dot}`} />
    </div>
  );
}

interface StatsRowProps {
  enrolledCourses: number;
  completedLessons: number;
  assignmentsDue: number;
  certificatesEarned: number;
}

export default function StatsRow({
  enrolledCourses,
  completedLessons,
  assignmentsDue,
  certificatesEarned,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Enrolled Courses"    value={enrolledCourses}    emoji="📚" color="blue"   />
      <StatCard label="Completed Lessons"   value={completedLessons}   emoji="✅" color="green"  />
      <StatCard label="Assignments Due"     value={assignmentsDue}     emoji="📝" color="orange" />
      <StatCard label="Certificates Earned" value={certificatesEarned} emoji="🏆" color="gold"   />
    </div>
  );
}
