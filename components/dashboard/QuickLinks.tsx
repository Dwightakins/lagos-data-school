import Link from "next/link";

const LINKS = [
  { label: "Browse Courses",       href: "/courses",                  emoji: "📚" },
  { label: "Upcoming Live Classes", href: "/dashboard/live",           emoji: "🎥" },
  { label: "My Assignments",        href: "/dashboard/assignments",    emoji: "📝" },
  { label: "My Certificates",       href: "/dashboard/certificates",   emoji: "🏆" },
];

export default function QuickLinks() {
  return (
    <section className="mb-10">
      <h2 className="text-[1.1rem] font-bold text-[#1F1F1F] mb-4">Quick Links</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-4 flex flex-col items-center gap-2 text-center hover:border-[#0056D2] hover:shadow-sm transition-all group"
          >
            <span className="text-2xl leading-none">{link.emoji}</span>
            <span className="text-[12.5px] font-semibold text-[#374151] group-hover:text-[#0056D2] transition-colors">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
