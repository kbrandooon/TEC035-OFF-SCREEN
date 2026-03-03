-- Update the reservation-documents bucket to allow PDF uploads.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'reservation-documents';
