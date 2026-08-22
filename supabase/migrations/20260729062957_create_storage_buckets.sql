/*
# Create storage buckets for avatars and verification docs

## Buckets
- `avatars` — public bucket for user profile photos
- `verification-docs` — private bucket for fee slips / ID card uploads

## Policies
- avatars: users can read all (public), upload/update/delete only their own
  folder (avatars/<uid>/...)
- verification-docs: users can upload to their own folder, read their own;
  only service role can read all (for manual verification review)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- ============ avatars policies ============
CREATE POLICY "avatars_read_all"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============ verification-docs policies ============
CREATE POLICY "verification_docs_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "verification_docs_read_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "verification_docs_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
