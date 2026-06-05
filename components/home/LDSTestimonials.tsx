"use client";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Lagos Data School changed my life. I went from teacher to data analyst in 4 months. The practical projects made all the difference.",
    name: "Chukwuemeka Obi",
    designation: "Data Analyst",
    src: "/images/student-2.jpg",
  },
  {
    quote: "The SQL and Python courses were exactly what I needed. I now earn in pounds working remotely. Best investment ever.",
    name: "Amaka Nwosu",
    designation: "BI Analyst",
    src: "/images/student-3.jpg",
  },
  {
    quote: "Zero coding experience before LDSL. Now I build dashboards for a top Nigerian bank. The instructors make everything clear.",
    name: "Tunde Adeyemi",
    designation: "Web Developer",
    src: "/images/student-1.jpg",
  },
];

export default function LDSTestimonials() {
  return (
    <section className="py-24 bg-[#FFFDD0] dark:bg-[#0A0A0A] transition-colors duration-300" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          data-mobile-motion-visible="true"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="text-[11.5px] font-bold text-[#722F37] uppercase tracking-[0.28em] mb-3 block">
            Success Stories
          </span>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-[#0A0A0A] dark:text-white leading-[1.1] tracking-[-0.025em]">
            Students Are Getting Hired
          </h2>
          <p className="text-[16px] text-[#4a4a4a] dark:text-[#AAAAAA] mt-4 max-w-lg mx-auto leading-relaxed">
            94% of our graduates land a job within 3 months of completing their course.
          </p>
        </motion.div>

        <AnimatedTestimonials testimonials={testimonials} autoplay />
      </div>
    </section>
  );
}
