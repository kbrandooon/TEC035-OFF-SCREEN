-- Add document_path column to reservations table.
-- Stores the Supabase Storage path of the generated PDF document.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS document_path TEXT;
