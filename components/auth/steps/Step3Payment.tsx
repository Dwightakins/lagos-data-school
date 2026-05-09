"use client";

import { Check } from "lucide-react";
import type { CourseItem } from "@/components/auth/types";

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const FULL_BENEFITS = [
  "Immediate course access after payment",
  "Priority instructor support",
  "Lifetime access to all materials",
  "Verified certificate on completion",
];

const SCHOLARSHIP_BENEFITS = [
  "Apply for a reduced price",
  "Same course content as full-pay students",
  "Application reviewed within 48 hours",
  "Verified certificate on completion",
];

interface Step3Props {
  selectedCourse: CourseItem;
  loading: boolean;
  onFullPay: () => void;
  onScholarship: () => void;
  onBack: () => void;
}

export default function Step3Payment({
  selectedCourse,
  loading,
  onFullPay,
  onScholarship,
  onBack,
}: Step3Props) {
  const scholarshipPrice = Math.round(selectedCourse.price * 0.1);

  return (
    <div>
      <h2 className="text-[1.4rem] font-bold text-gray-900 mb-1">Choose a payment plan</h2>
      <p className="text-[13.5px] text-gray-500 mb-1">
        {selectedCourse.emoji} {selectedCourse.name}
      </p>
      <p className="text-[13px] text-gray-400 mb-6">Full price: {fmt(selectedCourse.price)}</p>

      <div className="space-y-4 mb-6">
        {/* Full Pay */}
        <div className="border-2 border-[#0056D2] rounded-xl p-5 bg-blue-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#0056D2] bg-[#0056D2]/10 px-2.5 py-0.5 rounded-full mb-1.5">
                Full Pay
              </span>
              <p className="text-[1.75rem] font-bold text-gray-900 leading-none">
                {fmt(selectedCourse.price)}
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 mb-4">
            {FULL_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[12.5px] text-gray-700">
                <Check className="w-3.5 h-3.5 text-[#0056D2] shrink-0" strokeWidth={2.5} />
                {b}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onFullPay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#0056D2] hover:bg-[#0047B3] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[14px] py-2.5 rounded-lg transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <Spinner /> Processing…
              </>
            ) : (
              `Pay ${fmt(selectedCourse.price)} Now`
            )}
          </button>
        </div>

        {/* Scholarship */}
        <div className="border-2 border-gray-200 hover:border-gray-300 rounded-xl p-5 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1.5">
                Scholarship
              </span>
              <p className="text-[1.75rem] font-bold text-gray-900 leading-none">
                {fmt(scholarshipPrice)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">10% of full price</p>
            </div>
          </div>
          <ul className="space-y-1.5 mb-4">
            {SCHOLARSHIP_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[12.5px] text-gray-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                {b}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onScholarship}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-800 font-semibold text-[14px] py-2.5 rounded-lg border border-gray-300 transition-colors"
          >
            {loading ? (
              <>
                <Spinner /> Submitting…
              </>
            ) : (
              "Apply for Scholarship"
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors mx-auto"
      >
        ← Back to course selection
      </button>
    </div>
  );
}
