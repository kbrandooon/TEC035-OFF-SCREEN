-- Add end_date column to reservations for multi-day rental support.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Default end_date to date (single-day) for existing rows.
UPDATE public.reservations SET end_date = date WHERE end_date IS NULL;
