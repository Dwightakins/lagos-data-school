import { createAdminClient } from "@/lib/supabase/admin";

// Maps course title keywords → 2-3 letter code
const CODE_MAP: [string, string][] = [
  ["data anal",        "DA"],
  ["data science",     "DS"],
  ["cybersecurity",    "CY"],
  ["machine learn",    "ML"],
  ["software eng",     "SE"],
  ["full-stack",       "SE"],
  ["web dev",          "SE"],
  ["data eng",         "DE"],
  ["pipeline",         "DE"],
  ["python",           "PY"],
  ["sql",              "SQL"],
  ["database",         "DB"],
  ["cloud",            "CE"],
  ["ai engineer",      "AI"],
  ["artificial intel", "AI"],
  ["product design",   "PD"],
  ["ux",               "PD"],
  ["neural",           "ML"],
];

export function getCourseCode(title: string): string {
  const lower = title.toLowerCase();
  for (const [keyword, code] of CODE_MAP) {
    if (lower.includes(keyword)) return code;
  }
  // Fallback: first two letters of the first word, uppercased
  return (title.split(/\s+/)[0] ?? "XX").slice(0, 2).toUpperCase();
}

/**
 * Assigns a Student ID to a user based on their primary enrolled course.
 * Calls the Postgres generate_student_id() function (advisory-locked).
 * If the user already has a student_id, returns the existing one unchanged.
 * Returns null on failure (non-fatal — caller should log and continue).
 */
export async function assignStudentId(
  userId: string,
  courseTitle: string,
): Promise<string | null> {
  const code = getCourseCode(courseTitle);
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("generate_student_id", {
    p_user_id: userId,
    p_course_code: code,
  });

  if (error) {
    console.error("[student-id] generate_student_id rpc error:", error.message);
    return null;
  }

  return (data as string) ?? null;
}
