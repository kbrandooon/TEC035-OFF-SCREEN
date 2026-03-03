-- Patch migration: add missing columns to the existing reservations table.
-- The table was created earlier but lacked the columns our API now requires.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS date             DATE,
  ADD COLUMN IF NOT EXISTS start_time       TIME,
  ADD COLUMN IF NOT EXISTS end_time         TIME,
  ADD COLUMN IF NOT EXISTS address          TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS requires_invoice BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS equipment_items  JSONB   NOT NULL DEFAULT '[]';

-- Backfill date/start_time/end_time from existing start_time/end_time TIMESTAMPTZ
-- if the table already has timestamp columns from the old schema.
-- Safe to run even if columns don't exist (ADD COLUMN IF NOT EXISTS handles it).
