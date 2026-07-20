"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type EnrollmentStatus = "loading" | "guest" | "loggedIn" | "enrolled";

/**
 * Client-side status for gating public-page CTAs:
 *  - "guest"    → not logged in, show sign-up / enroll CTAs
 *  - "loggedIn" → logged in, no paid enrollment yet, show enroll CTAs
 *  - "enrolled" → has at least one paid enrollment, show "Go to Dashboard" only
 */
export function useEnrollmentStatus(): EnrollmentStatus {
  const [status, setStatus] = useState<EnrollmentStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (cancelled) return;
        if (!user) {
          setStatus("guest");
          return;
        }
        try {
          const res = await fetch("/api/enrollment/check");
          const json = (await res.json()) as { enrolled?: boolean };
          if (!cancelled) setStatus(json.enrolled ? "enrolled" : "loggedIn");
        } catch {
          if (!cancelled) setStatus("loggedIn");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("guest");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
