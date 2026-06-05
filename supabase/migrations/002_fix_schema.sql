-- ============================================================
-- Lagos Data School — Schema Fix Migration
-- Aligns column names with what the application code expects.
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================================

-- ── 1. Rename courses.is_published → published ───────────────
-- All app queries use .eq("published", true)
ALTER TABLE public.courses RENAME COLUMN is_published TO published;

-- Update the RLS policy that referenced is_published
DROP POLICY IF EXISTS "courses: published readable by all auth users" ON public.courses;
-- Allow anyone (including unauthenticated users) to see published courses.
-- This is needed so the registration wizard (Step 2) can list courses before the user has logged in.
CREATE POLICY "courses: published readable by anyone"
  ON public.courses FOR SELECT
  USING (published = true);


-- ── 2. Rename enrollments.student_id → user_id ───────────────
-- All app queries use .eq("user_id", user.id)
ALTER TABLE public.enrollments RENAME COLUMN student_id TO user_id;

-- Recreate the RLS policy with the new column name
DROP POLICY IF EXISTS "enrollments: student reads own" ON public.enrollments;
CREATE POLICY "enrollments: student reads own"
  ON public.enrollments FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "enrollments: admin full access" ON public.enrollments;
CREATE POLICY "enrollments: admin full access"
  ON public.enrollments FOR ALL
  USING (public.is_admin());


-- ── 3. Fix scholarship_applications ──────────────────────────
-- Rename student_id → user_id
ALTER TABLE public.scholarship_applications RENAME COLUMN student_id TO user_id;

-- Add missing columns that the verify API inserts
ALTER TABLE public.scholarship_applications
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS amount_paid       integer;

-- Recreate RLS policies
DROP POLICY IF EXISTS "scholarships: student reads own"    ON public.scholarship_applications;
DROP POLICY IF EXISTS "scholarships: student inserts own"  ON public.scholarship_applications;
DROP POLICY IF EXISTS "scholarships: admin update status"  ON public.scholarship_applications;

CREATE POLICY "scholarships: student reads own"
  ON public.scholarship_applications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "scholarships: student inserts own"
  ON public.scholarship_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "scholarships: admin update status"
  ON public.scholarship_applications FOR UPDATE
  USING (public.is_admin());


-- ── 4. Create payments table ─────────────────────────────────
-- Referenced by /api/paystack/verify but missing from initial schema
CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id  uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount     integer     NOT NULL,
  reference  text        NOT NULL UNIQUE,
  status     text        NOT NULL DEFAULT 'paid',
  provider   text        NOT NULL DEFAULT 'paystack',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments(user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments: student reads own"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "payments: admin full access"
  ON public.payments FOR ALL
  USING (public.is_admin());
