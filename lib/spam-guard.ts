import type { SupabaseClient } from "@supabase/supabase-js";

// Lightweight, dependency-free spam defenses for public, unauthenticated form routes
// (contact, scholarship apply). No single check here is bulletproof — together they
// raise the cost of automated abuse without adding infra (Redis, captcha, etc.).

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Best-effort, per-instance in-memory throttle. Serverless instances are not shared and
// cold starts reset this, so it only catches bursts hitting the same warm instance —
// the DB-backed check below is what actually holds across instances and restarts.
const hitsByKey = new Map<string, number[]>();

export function tooManyRequests(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (hitsByKey.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  hitsByKey.set(key, hits);
  if (hitsByKey.size > 5000) hitsByKey.clear(); // guard against unbounded growth
  return hits.length > max;
}

// Counts rows already submitted with this email in the window, using the table's own
// created_at column, so no schema changes are needed. Holds across instances/restarts.
export async function tooManyByEmail(
  admin: SupabaseClient,
  table: string,
  emailColumn: string,
  email: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(emailColumn, email)
    .gte("created_at", since);
  return (count ?? 0) >= max;
}

// A hidden field real users never fill and most bots do. Submissions that trip it are
// accepted with a normal-looking response but silently dropped, so bots don't learn to
// adapt.
export function honeypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// Real users take at least a little while to fill a form; bots often submit instantly.
export function submittedTooFast(loadedAtMs: unknown, minMs = 1200): boolean {
  const loadedAt = Number(loadedAtMs);
  if (!Number.isFinite(loadedAt)) return false; // missing timestamp — don't penalize
  return Date.now() - loadedAt < minMs;
}
