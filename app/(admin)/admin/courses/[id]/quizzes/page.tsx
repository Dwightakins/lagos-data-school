"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/types";

interface QuizWithQuestions extends Quiz {
  quiz_questions: QuizQuestion[];
}

const BLANK_Q: Omit<QuizQuestion, "id" | "quiz_id"> = {
  question_text: "", question_type: "multiple_choice",
  options: [{ text: "", correct: false }, { text: "", correct: false }, { text: "", correct: false }, { text: "", correct: false }],
  correct_answer: "", points: 1, order_index: 0,
};

export default function QuizzesPage() {
  const { id } = useParams<{ id: string }>();
  const [quizzes, setQuizzes] = useState<QuizWithQuestions[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [passScore, setPassScore] = useState("70");
  const [questions, setQuestions] = useState<Array<typeof BLANK_Q>>([{ ...BLANK_Q }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/admin/courses/${id}`).then((r) => r.json()),
      fetch(`/api/admin/quizzes?courseId=${id}`).then((r) => r.json()),
    ]).then(([course, q]) => {
      setCourseTitle(course.course?.title ?? "");
      setQuizzes(q.quizzes ?? []);
      setLoading(false);
    });
  }, [id]);

  async function createQuiz() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: id, title: newTitle, passing_score: Number(passScore), questions }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.quiz) {
      setQuizzes((prev) => [...prev, d.quiz]);
      setCreating(false); setNewTitle(""); setPassScore("70"); setQuestions([{ ...BLANK_Q }]);
    }
  }

  async function deleteQuiz(quizId: string) {
    await fetch(`/api/admin/quizzes?id=${quizId}`, { method: "DELETE" });
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { ...BLANK_Q, order_index: prev.length }]);
  }

  function updateQ(i: number, field: string, value: unknown) {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  function updateOption(qi: number, oi: number, field: "text" | "correct", value: string | boolean) {
    setQuestions((prev) => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = (q.options ?? []).map((o, j) => j === oi ? { ...o, [field]: field === "correct" ? value : value } : (field === "correct" && value ? { ...o, correct: false } : o));
      return { ...q, options: opts };
    }));
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/admin/courses/${id}`} className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div>
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.28em]">Quizzes</p>
          <h1 className="text-[1.5rem] font-bold text-foreground">{courseTitle}</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { label: "Content", href: `/admin/courses/${id}/content` },
          { label: "Materials", href: `/admin/courses/${id}/materials` },
          { label: "Quizzes", href: `/admin/courses/${id}/quizzes`, active: true },
          { label: "Assignments", href: `/admin/courses/${id}/assignments` },
        ].map((tab) => (
          <Link key={tab.label} href={tab.href} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${tab.active ? "bg-brand text-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{tab.label}</Link>
        ))}
      </div>

      {loading ? <div className="text-muted-foreground">Loading...</div> : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-foreground">{quiz.title}</p>
                  <p className="text-[12px] text-muted-foreground">{quiz.quiz_questions?.length ?? 0} questions · Pass: {quiz.passing_score}%</p>
                </div>
                <button onClick={() => deleteQuiz(quiz.id)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setExpanded(expanded === quiz.id ? null : quiz.id)}>
                  {expanded === quiz.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              {expanded === quiz.id && (
                <div className="border-t border-border px-5 py-4 space-y-3">
                  {(quiz.quiz_questions ?? []).map((q, i) => (
                    <div key={q.id} className="bg-muted/30 rounded-xl p-3">
                      <p className="text-[13px] font-medium text-foreground">{i + 1}. {q.question_text}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{q.question_type} · {q.points} pt{q.points !== 1 ? "s" : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {creating ? (
            <div className="bg-card border border-dashed border-brand/40 rounded-2xl p-6">
              <h3 className="text-[14px] font-bold text-foreground mb-4">New Quiz</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1">Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1">Pass Score (%)</label>
                  <input type="number" value={passScore} onChange={(e) => setPassScore(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-[13px] bg-background focus:outline-none" />
                </div>
              </div>

              <div className="space-y-4 mb-4">
                {questions.map((q, i) => (
                  <div key={i} className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-muted-foreground">Q{i + 1}</span>
                      <select value={q.question_type} onChange={(e) => updateQ(i, "question_type", e.target.value)} className="border border-border rounded-lg px-2 py-1 text-[12px] bg-background focus:outline-none">
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="short_answer">Short Answer</option>
                      </select>
                      <button onClick={() => setQuestions((p) => p.filter((_, j) => j !== i))} className="ml-auto text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <input value={q.question_text} onChange={(e) => updateQ(i, "question_text", e.target.value)} placeholder="Question text..." className="w-full border border-border rounded-lg px-3 py-1.5 text-[13px] bg-background focus:outline-none" />
                    {q.question_type === "multiple_choice" && (
                      <div className="space-y-1.5">
                        {(q.options ?? []).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input type="radio" checked={opt.correct} onChange={() => updateOption(i, oi, "correct", true)} name={`q${i}`} className="accent-teal-500" />
                            <input value={opt.text} onChange={(e) => updateOption(i, oi, "text", e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1 border border-border rounded-lg px-2 py-1 text-[12px] bg-background focus:outline-none" />
                          </div>
                        ))}
                      </div>
                    )}
                    {q.question_type === "true_false" && (
                      <div className="flex gap-4">
                        {["True", "False"].map((v) => (
                          <label key={v} className="flex items-center gap-2 text-[13px]">
                            <input type="radio" checked={q.correct_answer === v} onChange={() => updateQ(i, "correct_answer", v)} name={`tf${i}`} className="accent-teal-500" /> {v}
                          </label>
                        ))}
                      </div>
                    )}
                    {q.question_type === "short_answer" && (
                      <input value={q.correct_answer ?? ""} onChange={(e) => updateQ(i, "correct_answer", e.target.value)} placeholder="Expected answer (for auto-grading)" className="w-full border border-border rounded-lg px-3 py-1.5 text-[12px] bg-background focus:outline-none" />
                    )}
                    <div className="flex items-center gap-2">
                      <label className="text-[12px] text-muted-foreground">Points:</label>
                      <input type="number" value={q.points} onChange={(e) => updateQ(i, "points", Number(e.target.value))} className="w-16 border border-border rounded-lg px-2 py-1 text-[12px] bg-background focus:outline-none" />
                    </div>
                  </div>
                ))}
                <button onClick={addQuestion} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-[13px] text-muted-foreground hover:text-brand hover:border-brand/40 transition-colors">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={createQuiz} disabled={saving || !newTitle} className="flex-1 bg-brand text-foreground py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50">{saving ? "Saving..." : "Create Quiz"}</button>
                <button onClick={() => setCreating(false)} className="flex-1 border border-border text-muted-foreground py-2.5 rounded-xl text-[13px]">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-border hover:border-brand/40 text-[13px] text-muted-foreground hover:text-brand transition-colors">
              <Plus className="w-4 h-4" /> Add Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

