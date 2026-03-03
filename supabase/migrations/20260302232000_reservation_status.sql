-- Add status column to reservations with allowed values and a default of 'pending'.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'canceled'));
