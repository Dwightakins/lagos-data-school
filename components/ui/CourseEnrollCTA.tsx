"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  courseId: string;
  price: number;
}

type State = "loading" | "enrolled" | "loggedIn" | "loggedOut";

export default function CourseEnrollCTA({ courseId, price }: Props) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.auth.getUser(),
      fetch(`/api/enrollment/check?courseId=${courseId}`)
        .then((r) => r.json())
        .catch(() => ({ enrolled: false })) as Promise<{ enrolled: boolean }>,
    ]).then(([{ data: { user } }, enrollment]) => {
      if (enrollment.enrolled) {
        setState("enrolled");
      } else if (user) {
        setState("loggedIn");
      } else {
        setState("loggedOut");
      }
    }).catch(() => setState("loggedOut"));
  }, [courseId]);

  const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

  if (state === "loading") {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand/10 text-brand text-[14px] font-semibold">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking enrollment…
      </div>
    );
  }

  if (state === "enrolled") {
    return (
      <Link
        href={`/learn/${courseId}`}
        className="w-full flex items-center justify-center gap-2 gradient-brand text-brand-foreground font-bold text-[15px] py-3 rounded-xl transition-opacity hover:opacity-90 shadow-sm"
      >
        <BookOpen className="w-4 h-4" />
        Continue Learning
      </Link>
    );
  }

  if (state === "loggedIn") {
    return (
      <>
        <Link
          href={`/checkout?courseId=${courseId}`}
          className="w-full flex items-center justify-center gap-2 gradient-brand text-brand-foreground font-bold text-[15px] py-3 rounded-xl transition-opacity hover:opacity-90 shadow-sm"
        >
          Enroll Now — {fmt(price)}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href={`/checkout?courseId=${courseId}&type=scholarship`}
          className="w-full flex items-center justify-center gap-2 border-2 border-brand/40 text-brand hover:bg-brand/5 font-semibold text-[14px] py-2.5 rounded-xl transition-colors"
        >
          Apply for Scholarship
        </Link>
      </>
    );
  }

  // loggedOut
  return (
    <>
      <Link
        href={`/register?course=${courseId}`}
        className="w-full flex items-center justify-center gap-2 gradient-brand text-brand-foreground font-bold text-[15px] py-3 rounded-xl transition-opacity hover:opacity-90 shadow-sm"
      >
        Sign Up to Enroll
        <ArrowRight className="w-4 h-4" />
      </Link>
      <Link
        href={`/register?course=${courseId}&type=scholarship`}
        className="w-full flex items-center justify-center gap-2 border-2 border-brand/40 text-brand hover:bg-brand/5 font-semibold text-[14px] py-2.5 rounded-xl transition-colors"
      >
        Apply for Scholarship
      </Link>
    </>
  );
}
