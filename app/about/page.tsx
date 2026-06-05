import type { Metadata } from "next";
import Link from "next/link";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Users, GraduationCap, Award, Globe, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Lagos Data School Limited",
  description:
    "Lagos Data School Limited trains the next generation of African data professionals through practical, project-based education.",
};

const STATS = [
  { label: "Students Trained", value: "2,400+", Icon: Users },
  { label: "Courses Offered", value: "8+", Icon: GraduationCap },
  { label: "Certificates Issued", value: "1,800+", Icon: Award },
  { label: "Countries Reached", value: "12+", Icon: Globe },
];

const TEAM = [
  {
    name: "Adebayo Okonkwo",
    role: "Founder & Lead Instructor",
    bio: "10+ years in data science and machine learning. Former lead data scientist at a Pan-African fintech.",
  },
  {
    name: "Chinwe Eze",
    role: "Head of Curriculum",
    bio: "MSc Computer Science, UCL. Specialises in curriculum design for adult tech learners.",
  },
  {
    name: "Emeka Nwosu",
    role: "Engineering Lead",
    bio: "Full-stack engineer and open-source contributor. Builds the tools students use every day.",
  },
];

const VALUES = [
  {
    title: "Practical First",
    desc: "Every lesson is anchored in real projects. We don't teach theory without application.",
  },
  {
    title: "African Context",
    desc: "Our curriculum is built for the African job market — from Nigerian fintech to pan-African startups.",
  },
  {
    title: "Accessibility",
    desc: "World-class education shouldn't cost a fortune. Our scholarship programme ensures no one is left out.",
  },
  {
    title: "Outcomes Obsessed",
    desc: "We measure success by job placements, not enrolments. 94% of graduates are hired within 3 months.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />

      {/* Hero */}
      <section className="bg-foreground text-background py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <span className="text-[11.5px] font-bold text-brand uppercase tracking-[0.28em] mb-4 block">
            Our Story
          </span>
          <h1 className="text-[2.5rem] sm:text-[3.25rem] font-black leading-[1.05] mb-6 tracking-tight">
            Building Africa&rsquo;s Tech Talent Pipeline
          </h1>
          <p className="text-[17px] text-background/65 max-w-2xl mx-auto leading-relaxed">
            We believe every African professional deserves world-class tech education at an accessible
            price. Our mission is to close the skills gap by training practical, job-ready data professionals.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-muted py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {STATS.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="relative bg-card rounded-2xl border border-border p-6 text-center shadow-sm"
              >
                <GlowingEffect spread={15} glow={false} disabled={false} proximity={50} inactiveZone={0.1} borderWidth={1.5} />
                <Icon className="w-5 h-5 text-brand mx-auto mb-3" />
                <p className="text-[1.75rem] font-black text-foreground">{value}</p>
                <p className="text-[12px] text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-3 block">
              Our Mission
            </span>
            <h2 className="text-[1.9rem] font-bold text-foreground mb-5 leading-tight">
              Practical education that gets people hired
            </h2>
            <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
              Founded in Lagos in 2022, Lagos Data School Limited was born from a simple observation:
              talented Nigerians and Africans were being overlooked for global tech roles not because
              of ability, but because of a lack of structured, practical training.
            </p>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              We built a curriculum anchored in real projects, industry mentorship, and career support —
              the same education you&rsquo;d get at a top international bootcamp, delivered for the
              African context and priced for accessibility.
            </p>
          </div>
          <div className="relative bg-muted rounded-2xl border border-border p-8">
            <GlowingEffect spread={30} glow={false} disabled={false} proximity={80} inactiveZone={0.1} borderWidth={2} />
            <div className="space-y-5">
              {["94% job placement rate", "8+ industry-relevant courses", "Live + recorded classes", "Verified certificates"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                  <span className="text-[14px] font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted py-20 border-y border-border">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-3 block">
              What We Stand For
            </span>
            <h2 className="text-[1.75rem] font-bold text-foreground">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="relative bg-card rounded-2xl border border-border p-6 shadow-sm">
                <GlowingEffect spread={20} glow={false} disabled={false} proximity={60} inactiveZone={0.1} borderWidth={1.5} />
                <h3 className="font-bold text-foreground text-[15px] mb-2">{v.title}</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-foreground text-background py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-3 block">
              The Team
            </span>
            <h2 className="text-[1.75rem] font-bold">Built by practitioners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-background/10 border border-background/15 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mb-4 shadow-brand">
                  <span className="font-black text-brand-foreground text-[16px]">{member.name[0]}</span>
                </div>
                <h3 className="font-bold text-[15px] mb-0.5">{member.name}</h3>
                <p className="text-[11px] text-brand font-bold uppercase tracking-wide mb-3">{member.role}</p>
                <p className="text-[13px] text-background/60 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6 bg-background">
        <h2 className="text-[1.9rem] font-bold text-foreground mb-3">Ready to start learning?</h2>
        <p className="text-[15px] text-muted-foreground mb-8 max-w-md mx-auto">
          Join 2,400+ students building careers in data and technology across Africa.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-brand hover:opacity-90 text-brand-foreground font-bold text-[15px] px-10 py-4 rounded-xl transition-opacity shadow-brand"
        >
          Enroll Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <FooterSection />
    </div>
  );
}
