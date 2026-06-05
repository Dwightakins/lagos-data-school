-- Add status and type columns to enrollments to match what verify/webhook routes insert.
-- Existing rows get status='active' (the DEFAULT) automatically.
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS type   text NOT NULL DEFAULT 'full';

-- Backfill: rows inserted via the old enroll route have payment_status='paid'
-- but status may still be at the default 'active' which is correct.
-- Rows inserted via verify/webhook already have status='active' and type set.

-- For scholarship enrollments that came through the decision route, mark type accordingly.
-- (safe no-op if column was just added with default)
UPDATE public.enrollments
SET type = 'scholarship'
WHERE payment_status = 'pending'
  AND type = 'full';
