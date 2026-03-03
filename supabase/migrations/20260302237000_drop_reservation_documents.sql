-- Remove document_path column from reservations table.
ALTER TABLE public.reservations
  DROP COLUMN IF EXISTS document_path;

-- Drop Storage RLS policies for reservation-documents bucket.
DROP POLICY IF EXISTS "Tenant can upload reservation documents"  ON storage.objects;
DROP POLICY IF EXISTS "Public can read reservation documents"    ON storage.objects;
DROP POLICY IF EXISTS "Tenant can update reservation documents"  ON storage.objects;
DROP POLICY IF EXISTS "Tenant can delete reservation documents"  ON storage.objects;

-- NOTE: The reservation-documents bucket itself must be deleted via the
-- Supabase Storage API or Dashboard UI (SQL deletes on storage tables are blocked).
