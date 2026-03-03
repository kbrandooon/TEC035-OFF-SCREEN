-- Patch: add missing columns to reservations table (client_id, notes, end_date).
-- Uses IF NOT EXISTS so it is safe to re-run.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS notes     TEXT,
  ADD COLUMN IF NOT EXISTS end_date  DATE;
