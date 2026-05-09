import Link from "next/link";

const ACTIONS = [
  {
    label: "Browse Courses",
    desc: "Explore our full catalog",
    href: "/courses",
    emoji: "📚",
    bg: "bg-blue-50 border-blue-100 group-hover:bg-[#1A56DB]",
  },
  {
    label: "View Certificates",
    desc: "Download your achievements",
    href: "/dashboard/certificates",
    emoji: "🏆",
    bg: "bg-amber-50 border-amber-100 group-hover:bg-amber-500",
  },
  {
    label: "Update Profile",
    desc: "Manage your account details",
    href: "/dashboard/profile",
    emoji: "👤",
    bg: "bg-slate-50 border-slate-200 group-hover:bg-slate-700",
  },
];

export default function QuickActions() {
  return (
    <section>
      <h2 className="text-[1.15rem] font-bold text-[#0f172a] mb-5">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 transition-all duration-200 ${action.bg}`}>
              <span className="text-[22px] leading-none">{action.emoji}</span>
            </div>
            <p className="text-[14px] font-semibold text-[#0f172a] mb-1 group-hover:text-[#1A56DB] transition-colors">
              {action.label}
            </p>
            <p className="text-[12px] text-slate-500">{action.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
