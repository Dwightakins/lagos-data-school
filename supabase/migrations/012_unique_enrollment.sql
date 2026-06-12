-- Ensure unique (user_id, course_id) constraint on enrollments.
-- If duplicate rows exist, keep the oldest row per pair before adding the constraint.
DO $$
BEGIN
  -- Remove duplicates: for each (user_id, course_id) pair, keep the row
  -- with the earliest enrolled_at; delete the rest.
  DELETE FROM public.enrollments e1
  USING public.enrollments e2
  WHERE e1.user_id = e2.user_id
    AND e1.course_id = e2.course_id
    AND e1.enrolled_at > e2.enrolled_at;

  -- Add unique constraint only if it doesn't already exist.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_course'
      AND conrelid = 'public.enrollments'::regclass
  ) THEN
    ALTER TABLE public.enrollments
      ADD CONSTRAINT unique_user_course UNIQUE (user_id, course_id);
  END IF;
END $$;
