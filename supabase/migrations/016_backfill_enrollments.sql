-- Backfill enrollments created before the status column was added.
-- Old rows have status = NULL and payment_status = NULL; set them to active/paid.

UPDATE public.enrollments
SET status = 'active'
WHERE status IS NULL;

UPDATE public.enrollments
SET payment_status = 'paid'
WHERE payment_status IS NULL
  AND status = 'active';
