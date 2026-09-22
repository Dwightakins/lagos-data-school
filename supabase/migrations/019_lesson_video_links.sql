-- Live/recorded session fields for lessons.
-- NOTE: the requested filename was 017_lesson_video_links.sql, but 017 is already used by
-- 017_materials_visible_to_all.sql. Numbered 019 instead (018_contact_messages.sql is the
-- last existing migration) so it doesn't collide or get skipped.

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS zoom_schedule TEXT,
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
