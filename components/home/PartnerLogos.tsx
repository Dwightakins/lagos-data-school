const PARTNERS = [
  "Flutterwave",
  "Paystack",
  "Andela",
  "Interswitch",
  "Cowrywise",
  "Piggyvest",
  "Kuda Bank",
  "Carbon",
  "Moniepoint",
  "TeamApt",
];

export default function PartnerLogos() {
  return (
    <section className="py-12 bg-white dark:bg-[#0a0f1a] border-b border-[#e7e9ea] dark:border-white/8 overflow-hidden">
      <p className="text-center text-[11px] font-bold text-[#132128]/35 dark:text-white/35 uppercase tracking-[0.25em] mb-8">
        Our graduates now work at
      </p>

      <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-marquee flex shrink-0 gap-12 pr-12">
          {[...PARTNERS, ...PARTNERS].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex items-center gap-2 shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1A56DB]/10 flex items-center justify-center">
                <span className="text-[10px] font-black text-[#1A56DB]">
                  {name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="text-[13px] font-semibold text-[#132128]/60 dark:text-white/55 whitespace-nowrap">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
