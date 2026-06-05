-- ============================================================
-- 004_student_id.sql
-- Adds student_id to users and certificate_number to certificates.
-- The generate_student_id() function is called via supabase.rpc()
-- from API routes — it uses an advisory lock to prevent duplicates.
-- ============================================================

-- 1. student_id column on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS student_id text UNIQUE;

-- 2. certificate_number column on certificates
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS certificate_number text UNIQUE;

-- 3. Atomic student-ID generator (per course code, advisory-locked)
CREATE OR REPLACE FUNCTION public.generate_student_id(
  p_user_id  uuid,
  p_course_code text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing text;
  v_count    bigint;
  v_id       text;
BEGIN
  -- Fast-path: already assigned
  SELECT student_id INTO v_existing FROM public.users WHERE id = p_user_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Advisory transaction lock — one generator per course code at a time
  PERFORM pg_advisory_xact_lock(
    hashtext('ldsl_student_id_' || p_course_code)
  );

  -- Re-check after acquiring lock (another request may have just set it)
  SELECT student_id INTO v_existing FROM public.users WHERE id = p_user_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Count IDs already assigned for this course code
  SELECT COUNT(*) INTO v_count
  FROM public.users
  WHERE student_id LIKE 'LDSL/' || p_course_code || '/%';

  -- Build next ID
  v_id := 'LDSL/' || p_course_code || '/' || LPAD((v_count + 1)::text, 3, '0');

  -- Assign
  UPDATE public.users SET student_id = v_id WHERE id = p_user_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_student_id(uuid, text)
  TO service_role;
