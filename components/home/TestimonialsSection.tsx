import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-14 md:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand">Student stories</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Real Nigerians. Real tech careers.
          </h2>
        </div>
        <AnimatedTestimonials
          testimonials={[
            {
              name: "Chukwuemeka Obi",
              designation: "Backend Engineer",
              src: "/images/student-2.jpg",
              quote:
                "I joined LDSL with zero coding background. Twelve weeks later I was writing Go in production. The instructors don't just teach — they raise the bar.",
            },
            {
              name: "Amaka Nwosu",
              designation: "Product Designer",
              src: "/images/student-3.jpg",
              quote:
                "The portfolio reviews were brutal in the best way. I now design for a UK fintech, remote from Lagos, earning in pounds. LDSL rebuilt my standards.",
            },
            {
              name: "Tunde Adeyemi",
              designation: "Data Analyst",
              src: "/images/student-1.jpg",
              quote:
                "Live classes, real projects, no fluff. Six months after graduating I lead data analytics at one of Nigeria's biggest banks. This school is the real deal.",
            },
          ]}
        />
      </div>
    </section>
  );
}
