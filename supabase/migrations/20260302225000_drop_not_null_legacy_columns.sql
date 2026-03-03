-- Drop NOT NULL on legacy columns that are no longer used by the new API.
ALTER TABLE public.reservations
  ALTER COLUMN hour DROP NOT NULL;
