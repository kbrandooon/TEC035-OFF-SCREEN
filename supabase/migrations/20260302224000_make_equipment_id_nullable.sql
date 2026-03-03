-- The original reservations table had equipment_id UUID NOT NULL (single FK).
-- We now store equipment as a JSONB array (equipment_items), so make it nullable.
ALTER TABLE public.reservations
  ALTER COLUMN equipment_id DROP NOT NULL;
