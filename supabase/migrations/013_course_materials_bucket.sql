-- Create the storage bucket for course materials if it doesn't exist.
-- Files are publicly readable so students can download them via a direct URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials',
  'course-materials',
  true,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow admins (via service role) to upload and delete.
-- Allow anyone to read (SELECT) since the bucket is public.
CREATE POLICY "Admins can upload course materials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Admins can delete course materials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-materials');

CREATE POLICY "Public can read course materials"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'course-materials');
