-- Student notes (admin private notes about a student)
CREATE TABLE IF NOT EXISTS student_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  note        TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage student notes" ON student_notes USING (true);

-- Track learning time per lesson
ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;

-- Add status column to certificates if it does not exist
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'superseded')),
  ADD COLUMN IF NOT EXISTS revoke_reason TEXT,
  ADD COLUMN IF NOT EXISTS issued_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS certificate_number TEXT;

-- Certificate templates
CREATE TABLE IF NOT EXISTS certificate_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_url  TEXT,
  template_data   JSONB,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage certificate templates" ON certificate_templates USING (true);

-- Student suspension
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;
