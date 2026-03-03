-- Add document_path to store the path of the uploaded HTML preview in Storage.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS document_path TEXT;

-- Create the reservation-documents Storage bucket (public read).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reservation-documents',
  'reservation-documents',
  true,
  5242880,   -- 5 MB
  ARRAY['text/html']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users of the same tenant can upload.
CREATE POLICY "Tenant can upload reservation documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reservation-documents'
    AND auth.role() = 'authenticated'
  );

-- RLS: public can read (for iframe embed via public URL).
CREATE POLICY "Public can read reservation documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reservation-documents');
