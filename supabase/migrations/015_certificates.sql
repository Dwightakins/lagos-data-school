-- Certificates storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('certificates', 'certificates', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can read certificates (public)
CREATE POLICY "public read certificates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

-- Storage policy: service role can write (API only)
CREATE POLICY "service role write certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates');

-- Enrollments: track completion
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_percentage INTEGER NOT NULL DEFAULT 0;

-- Certificates: ensure all needed columns exist
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'superseded')),
  ADD COLUMN IF NOT EXISTS revoke_reason TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Unique index on certificate_number (non-null values only)
CREATE UNIQUE INDEX IF NOT EXISTS certificates_number_uniq
  ON public.certificates(certificate_number)
  WHERE certificate_number IS NOT NULL;
