import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types";
import { ResizableNavbar } from "@/components/layout/ResizableNavbar";
import { FooterSection } from "@/components/home/FooterSection";
import LDSCoursesClient from "@/components/courses/LDSCoursesClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Courses — Lagos Data School Limited",
  description:
    "Browse practical, project-based courses in data analysis, machine learning, software engineering and more.",
};

const FALLBACK_COURSES: Course[] = [
  { id: "1", title: "Data Analysis with Python", slug: "data-analysis-python", description: "Learn to analyse data using Python, Pandas, and visualisation tools.", price: 200000, duration: "12 weeks", published: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "2", title: "Machine Learning Engineering", slug: "machine-learning-engineering", description: "Build and deploy ML models from scratch using scikit-learn and TensorFlow.", price: 200000, duration: "16 weeks", published: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "3", title: "Software Engineering", slug: "software-engineering", description: "Full-stack web development with modern JavaScript, React, and Node.js.", price: 200000, duration: "20 weeks", published: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "4", title: "Data Engineering & Pipelines", slug: "data-engineering", description: "Design and build scalable data pipelines using SQL, dbt, and cloud tools.", price: 200000, duration: "14 weeks", published: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "5", title: "SQL & Database Design", slug: "sql-database-design", description: "Master relational databases, SQL querying, and schema design.", price: 200000, duration: "8 weeks", published: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "6", title: "AI Engineering", slug: "ai-engineering", description: "Build production-ready AI applications with LLMs, RAG, and prompt engineering.", price: 200000, duration: "18 weeks", published: true, created_at: "2024-01-01T00:00:00Z" },
];

export default async function CoursesPage() {
  const supabase = await createClient();

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
  const fetchResult = supabase
    .from("courses")
    .select("id, title, slug, description, price, duration")
    .eq("published", true)
    .order("created_at", { ascending: true });

  const result = await Promise.race([fetchResult, timeout]);
  const courses: Course[] = result && "data" in result && result.data
    ? (result.data as Course[])
    : FALLBACK_COURSES;

  return (
    <div className="min-h-screen bg-background">
      <ResizableNavbar />
      <LDSCoursesClient courses={courses} />
      <FooterSection />
    </div>
  );
}
