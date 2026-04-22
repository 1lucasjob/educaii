DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Avatar images can be read by path"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND name IS NOT NULL
  AND name <> ''
);