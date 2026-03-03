-- Add daily_rate column to equipment table
-- Used for pricing equipment in reservations

ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS daily_rate numeric(10, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN equipment.daily_rate IS 'Rental price per day in MXN for this equipment item.';
