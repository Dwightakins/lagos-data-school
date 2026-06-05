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
          ? "border-[#0D9488] bg-[#F0FDFA]"
          : "border-[#e7e9ea] bg-white hover:border-[#5EEAD4] hover:bg-[#F0FDFA]"
      }`}
    >
      <div className="text-2xl mb-2">{emoji}</div>
      <p
        className={`text-[13px] font-bold mb-1 leading-snug ${
          selected ? "text-[#0D9488]" : "text-[#134E4A]"
        }`}
      >
        {name}
      </p>
      <p className="text-[11px] text-[#64748B] mb-2 leading-relaxed line-clamp-2">{desc}</p>
      <p className={`text-[12px] font-bold ${selected ? "text-[#0D9488]" : "text-[#134E4A]"}`}>
        {fmt(price)}
      </p>
    </button>
  );
}
