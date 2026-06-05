import { PointerHighlight } from "@/components/ui/pointer-highlight";

const steps = [
  { n: "01", title: "Apply", body: "Tell us your goals. We'll match you with the right cohort and track." },
  { n: "02", title: "Learn live", body: "Join 12 weeks of live instructor‑led sessions, weekly projects and reviews." },
  { n: "03", title: "Build proof", body: "Ship a portfolio of production‑quality work reviewed by senior engineers." },
  { n: "04", title: "Get placed", body: "Mock interviews, CV polish and warm intros to our hiring partner network." },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="relative py-14 md:py-36 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand">How it works</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
            Four steps from{" "}
            <PointerHighlight>
              <span className="text-foreground">curious</span>
            </PointerHighlight>{" "}
            to{" "}
            <PointerHighlight rectangleClassName="border-gold" pointerClassName="text-gold">
              <span className="text-foreground">employed</span>
            </PointerHighlight>
            .
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-3xl overflow-hidden border border-border">
          {steps.map((s) => (
            <div key={s.n} className="bg-card p-8 md:p-10 group hover:bg-accent/40 transition">
              <div className="font-mono text-sm font-semibold text-brand">{s.n}</div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-foreground tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
