import Image from "next/image";
import { Users, Briefcase, type LucideIcon } from "lucide-react";
import { BackgroundLines } from "@/components/ui/background-lines";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface GridItemProps {
  area: string;
  icon?: LucideIcon;
  title: string;
  desc: string;
  image?: string;
}

const items: GridItemProps[] = [
  {
    area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
    title: "20+ Curated Courses",
    desc: "From fundamentals to specialization — every track built with hiring partners.",
    image: "/images/feature-courses.jpg",
  },
  {
    area: "md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]",
    title: "Live Cohort Classes",
    desc: "Real instructors. Weekly office hours. Africa‑first timezone.",
    image: "/images/feature-live.jpg",
  },
  {
    area: "md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]",
    title: "Verified Certificates",
    desc: "Industry‑recognised credentials with QR verification.",
    image: "/images/feature-cert.jpg",
  },
  {
    area: "md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]",
    icon: Users,
    title: "Student Community",
    desc: "1,200+ peers in private channels — pair‑program, share wins and find your next co‑founder.",
    image: "/images/community.jpg",
  },
  {
    area: "md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]",
    icon: Briefcase,
    title: "Job Placement Support",
    desc: "Mock interviews, CV reviews and warm intros to 60+ partner companies hiring African talent.",
    image: "/images/job-placement.jpg",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-14 md:py-36 overflow-hidden bg-background">
      <BackgroundLines className="absolute inset-0 h-full" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand">The Platform</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Built for aspiring Tech Professionals.<br className="hidden md:block" />
            <span className="text-muted-foreground">Engineered for outcomes.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            Everything you need to go from beginner to employed engineer — without the noise.
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 xl:grid-rows-2">
          {items.map((it, i) => (
            <GridItem key={i} {...it} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function GridItem({ area, icon: Icon, title, desc, image }: GridItemProps) {
  return (
    <li className={`min-h-[16rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-border/70 p-2 md:rounded-3xl md:p-3">
        <GlowingEffect spread={40} glow disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />

        {image ? (
          /* Card with photo */
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl border-[0.5px] border-border/50 bg-card shadow-sm">
            <div className="relative h-44 w-full shrink-0">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
            </div>
            <div className="p-6 md:p-7">
              <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground tracking-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm md:text-[15px] text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        ) : (
          /* Card with icon only */
          <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.5px] border-border/50 bg-card p-6 shadow-sm md:p-7">
            {Icon && (
              <div className="w-fit rounded-lg border border-border/60 bg-background p-2.5">
                <Icon className="h-5 w-5 text-brand" />
              </div>
            )}
            <div>
              <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground tracking-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm md:text-[15px] text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
