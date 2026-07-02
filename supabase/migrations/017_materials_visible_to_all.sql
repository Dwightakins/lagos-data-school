-- Allow admin to mark a material visible to all enrolled students (not just one course)
ALTER TABLE public.lesson_materials
  ADD COLUMN IF NOT EXISTS visible_to_all BOOLEAN NOT NULL DEFAULT false;

-- Index for fast lookup of globally-visible materials
CREATE INDEX IF NOT EXISTS lesson_materials_visible_idx
  ON public.lesson_materials(visible_to_all)
  WHERE visible_to_all = true;
