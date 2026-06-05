import Image from "next/image";

export interface CourseCatalogCardProps {
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  thumbnailAlt?: string;
  onEnroll?: () => void;
  href?: string;
  badge?: string;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function CourseCatalogCard({
  title,
  description,
  price,
  thumbnailUrl,
  thumbnailAlt = "Course thumbnail",
  onEnroll,
  badge,
}: CourseCatalogCardProps) {
  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-[#5EEAD4]/45 shadow-sm hover:shadow-lg hover:shadow-[#134E4A]/10 transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt={thumbnailAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {badge && (
          <span className="absolute top-3 left-3 bg-[#EA580C] text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3
          className="text-[15px] font-bold leading-snug text-[#134E4A] line-clamp-2"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h3>

        <p className="text-[13px] text-[#64748B] leading-relaxed line-clamp-2 flex-1">
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-[#5EEAD4]/35">
          <span
            className="text-[18px] font-extrabold text-[#134E4A]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {formatNaira(price)}
          </span>

          <button
            type="button"
            onClick={onEnroll}
            className="
              px-5 py-2 rounded-xl text-[13px] font-bold text-white
              bg-[#EA580C]
              hover:bg-[#C2410C]
              active:scale-95
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2
            "
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}
