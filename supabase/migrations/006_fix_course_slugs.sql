-- Generate slugs from titles for any course with a NULL or empty slug
UPDATE public.courses
SET slug = trim(
  both '-' from
  lower(
    regexp_replace(
      regexp_replace(trim(title), '[^a-zA-Z0-9 ]', '', 'g'),
      '\s+', '-', 'g'
    )
  )
)
WHERE slug IS NULL OR trim(slug) = '';
