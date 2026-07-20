import { createClient } from "@/lib/supabase/server";
import { CoursesShowcaseGrid } from "@/components/home/CoursesShowcaseGrid";

interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  duration?: string;
}

const FALLBACK: CourseSummary[] = [
  { id: "1", title: "Data Analysis with Python", slug: "data-analysis-python", description: "Learn to analyse data using Python, Pandas, and visualisation tools.", price: 250000 },
  { id: "2", title: "Machine Learning Engineering", slug: "machine-learning-engineering", description: "Build and deploy ML models from scratch using scikit-learn and TensorFlow.", price: 250000 },
  { id: "3", title: "Data Engineering & Pipelines", slug: "data-engineering", description: "Design and build scalable data pipelines using SQL, dbt, and cloud tools.", price: 250000 },
  { id: "4", title: "AI Engineering", slug: "ai-engineering", description: "Build production-ready AI applications with LLMs, RAG, and prompt engineering.", price: 250000 },
];

export async function CoursesShowcaseSection() {
  let courses: CourseSummary[] = FALLBACK.slice(0, 3);

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("courses")
      .select("id, title, slug, description, price, duration")
      .eq("published", true)
      .order("created_at", { ascending: true })
      .limit(3);

    if (data && data.length > 0) {
      courses = data as CourseSummary[];
    }
  } catch { /* use fallback */ }

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold text-brand uppercase tracking-[0.28em] mb-3 block">
            Our Programmes
          </span>
          <h2 className="text-[2rem] sm:text-[2.5rem] font-bold text-foreground leading-tight mb-4">
            Learn In-Demand Skills
          </h2>
          <p className="text-[15px] text-muted-foreground max-w-xl mx-auto">
            Practical, project-based courses built for the African tech economy.
            Get certified and land your first role.
          </p>
        </div>

        <CoursesShowcaseGrid courses={courses} />
      </div>
    </section>
  );
}
