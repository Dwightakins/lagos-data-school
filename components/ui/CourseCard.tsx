interface CourseCardProps {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  selected?: boolean;
  onClick?: () => void;
}

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function CourseCard({
  name,
  emoji,
  desc,
  price,
  selected = false,
  onClick,
}: CourseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all w-full ${
        selected
          ? "border-[#1A56DB] bg-[#EFF6FF]"
          : "border-[#E5E7EB] bg-white hover:border-[#93C5FD] hover:bg-[#F8FAFF]"
      }`}
    >
      <div className="text-2xl mb-2">{emoji}</div>
      <p
        className={`text-[13px] font-bold mb-1 leading-snug ${
          selected ? "text-[#1A56DB]" : "text-[#1F1F1F]"
        }`}
      >
        {name}
      </p>
      <p className="text-[11px] text-[#6B7280] mb-2 leading-relaxed line-clamp-2">{desc}</p>
      <p className={`text-[12px] font-bold ${selected ? "text-[#1A56DB]" : "text-[#374151]"}`}>
        {fmt(price)}
      </p>
    </button>
  );
}
