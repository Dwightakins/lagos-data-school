import type { Metadata } from "next";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, MapPin, Phone, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — Lagos Data School Limited",
  description: "Get in touch with the Lagos Data School team for enrollment questions, partnerships, or support.",
};

const CONTACT_INFO = [
  { Icon: Mail, label: "Email", value: "hello@lagosdataschool.com", href: "mailto:hello@lagosdataschool.com" },
  { Icon: Phone, label: "Phone / WhatsApp", value: "+234 800 000 0000", href: "tel:+2348000000000" },
  { Icon: MapPin, label: "Address", value: "Lagos Island, Lagos, Nigeria", href: null },
  { Icon: MessageSquare, label: "Live Chat", value: "Available Mon–Fri, 9am–5pm WAT", href: null },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />

      {/* Hero */}
      <section className="bg-foreground text-background py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <span className="text-[11.5px] font-bold text-brand uppercase tracking-[0.28em] mb-4 block">
            Get in Touch
          </span>
          <h1 className="text-[2.5rem] sm:text-[3rem] font-black leading-[1.05] mb-4 tracking-tight">
            Contact Us
          </h1>
          <p className="text-[16px] text-background/60 max-w-xl mx-auto leading-relaxed">
            Have questions about enrollment, our courses, or partnerships? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-2 gap-8">

          {/* Contact info */}
          <div className="space-y-4">
            <h2 className="text-[1.25rem] font-bold text-foreground mb-6">How to reach us</h2>
            {CONTACT_INFO.map(({ Icon, label, value, href }) => (
              <div key={label} className="relative bg-card rounded-2xl border border-border p-5 flex items-start gap-4 shadow-sm">
                <GlowingEffect spread={15} glow={false} disabled={false} proximity={50} inactiveZone={0.1} borderWidth={1.5} />
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-brand uppercase tracking-wide mb-0.5">{label}</p>
                  {href ? (
                    <a href={href} className="text-[14px] font-semibold text-foreground hover:text-brand transition-colors">
                      {value}
                    </a>
                  ) : (
                    <p className="text-[14px] font-semibold text-foreground">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive form */}
          <ContactForm />
        </div>
      </div>

      <FooterSection />
    </div>
  );
}
