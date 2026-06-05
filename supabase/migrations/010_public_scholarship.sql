-- Allow public (unauthenticated) scholarship applications
-- Make user_id nullable so applicants don't need an account
ALTER TABLE scholarship_applications
  ALTER COLUMN user_id DROP NOT NULL;

-- Add contact fields for applicants who don't have an account
ALTER TABLE scholarship_applications
  ADD COLUMN IF NOT EXISTS applicant_name  text,
  ADD COLUMN IF NOT EXISTS applicant_email text,
  ADD COLUMN IF NOT EXISTS applicant_phone text,
  ADD COLUMN IF NOT EXISTS essay           text;

-- Allow public INSERT (no auth required)
DROP POLICY IF EXISTS "Users can insert own applications" ON scholarship_applications;
CREATE POLICY "Anyone can submit scholarship application"
  ON scholarship_applications FOR INSERT
  WITH CHECK (true);

-- Keep existing select/update policies for authenticated users
-- Admins can see all via service-role client (bypasses RLS)
