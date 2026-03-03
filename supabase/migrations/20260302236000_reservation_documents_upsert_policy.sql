-- Add UPDATE + DELETE Storage policies needed for upsert operations.
-- Uses DO block to safely skip if the policy already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Tenant can update reservation documents'
  ) THEN
    CREATE POLICY "Tenant can update reservation documents"
      ON storage.objects FOR UPDATE
      WITH CHECK (
        bucket_id = 'reservation-documents'
        AND auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'Tenant can delete reservation documents'
  ) THEN
    CREATE POLICY "Tenant can delete reservation documents"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'reservation-documents'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;
