-- Add duration column to courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS duration text;

-- Set duration by course title pattern (adjust values to match actual titles)
UPDATE public.courses SET duration = '8 weeks'
WHERE lower(title) LIKE '%sql%'
   OR lower(title) LIKE '%database%';

UPDATE public.courses SET duration = '8 weeks'
WHERE lower(title) LIKE '%data anal%'
   OR lower(title) LIKE '%analytics%';

UPDATE public.courses SET duration = '6 weeks'
WHERE lower(title) LIKE '%python%';

UPDATE public.courses SET duration = '12 weeks'
WHERE lower(title) LIKE '%machine learn%'
   OR lower(title) LIKE '%data eng%'
   OR lower(title) LIKE '%pipeline%';

UPDATE public.courses SET duration = '16 weeks'
WHERE lower(title) LIKE '%software%'
   OR lower(title) LIKE '%full-stack%'
   OR lower(title) LIKE '%full stack%'
   OR lower(title) LIKE '%web dev%';

UPDATE public.courses SET duration = '10 weeks'
WHERE lower(title) LIKE '%ai%'
   OR lower(title) LIKE '%artificial intelligence%';

UPDATE public.courses SET duration = '10 weeks'
WHERE lower(title) LIKE '%cloud%';

UPDATE public.courses SET duration = '8 weeks'
WHERE lower(title) LIKE '%cyber%'
   OR lower(title) LIKE '%security%';

UPDATE public.courses SET duration = '10 weeks'
WHERE lower(title) LIKE '%product design%'
   OR lower(title) LIKE '%ux%'
   OR lower(title) LIKE '%figma%';

-- Default for any remaining courses
UPDATE public.courses
SET duration = '12 weeks'
WHERE duration IS NULL;
