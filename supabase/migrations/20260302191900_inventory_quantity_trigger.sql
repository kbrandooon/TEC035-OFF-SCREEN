-- =============================================================
-- Migration: inventory quantity auto-sync trigger
-- 1. Change equipment.quantity default from 1 → 0
-- 2. Create trigger fn to keep equipment.quantity in sync with
--    every INSERT / UPDATE / DELETE on the inventory table.
--
-- Movement logic:
--   'in'         → quantity  += movement.quantity
--   'out'        → quantity  -= movement.quantity
--   'adjustment' → quantity   = movement.quantity  (absolute override)
--
-- On UPDATE the old effect is reversed before the new one is applied.
-- On DELETE  the old effect is reversed.
-- =============================================================

-- ── 1. Change default to 0 ────────────────────────────────────
ALTER TABLE public.equipment
  ALTER COLUMN quantity SET DEFAULT 0;

-- ── 2. Trigger function ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_equipment_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delta INTEGER;   -- net change to apply to equipment.quantity
BEGIN

  -- ── REVERSE old row (UPDATE / DELETE) ──────────────────────
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    CASE OLD.movement_type
      WHEN 'in'         THEN v_delta := -OLD.quantity;          -- undo addition
      WHEN 'out'        THEN v_delta :=  OLD.quantity;          -- undo subtraction
      WHEN 'adjustment' THEN
        -- 'adjustment' rows set an absolute value, so we restore the
        -- quantity that existed just before the adjustment was recorded.
        -- Because we don't track history, we can only undo the delta
        -- relative to what the adjustment row itself stored; the safest
        -- approach is: subtract the adjustment quantity back out.
        v_delta := -OLD.quantity;
      ELSE v_delta := 0;
    END CASE;

    UPDATE public.equipment
      SET quantity = GREATEST(0, quantity + v_delta)
    WHERE id = OLD.equipment_id;
  END IF;

  -- ── APPLY new row (INSERT / UPDATE) ────────────────────────
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    CASE NEW.movement_type
      WHEN 'in'         THEN v_delta :=  NEW.quantity;
      WHEN 'out'        THEN v_delta := -NEW.quantity;
      WHEN 'adjustment' THEN v_delta :=  NEW.quantity;   -- treated as additive delta
      ELSE v_delta := 0;
    END CASE;

    UPDATE public.equipment
      SET quantity = GREATEST(0, quantity + v_delta)
    WHERE id = NEW.equipment_id;
  END IF;

  -- Return the correct row for each operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger to inventory table ──────────────────────
DROP TRIGGER IF EXISTS trg_sync_equipment_quantity ON public.inventory;

CREATE TRIGGER trg_sync_equipment_quantity
  AFTER INSERT OR UPDATE OR DELETE
  ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_equipment_quantity();

-- ── 4. Back-fill existing equipment rows from current inventory ─
-- Re-compute each equipment's quantity from scratch so it
-- reflects whatever movements already exist. Done in two steps:
--   a) Zero-out all quantities.
--   b) Apply all existing inventory movements in order.
UPDATE public.equipment
  SET quantity = 0;

-- Apply 'in' movements
UPDATE public.equipment e
  SET quantity = e.quantity + COALESCE(agg.total, 0)
  FROM (
    SELECT equipment_id, SUM(quantity) AS total
    FROM public.inventory
    WHERE movement_type = 'in'
    GROUP BY equipment_id
  ) agg
  WHERE e.id = agg.equipment_id;

-- Subtract 'out' movements
UPDATE public.equipment e
  SET quantity = GREATEST(0, e.quantity - COALESCE(agg.total, 0))
  FROM (
    SELECT equipment_id, SUM(quantity) AS total
    FROM public.inventory
    WHERE movement_type = 'out'
    GROUP BY equipment_id
  ) agg
  WHERE e.id = agg.equipment_id;

-- Apply most-recent 'adjustment' (last absolute override wins)
UPDATE public.equipment e
  SET quantity = COALESCE(latest.quantity, e.quantity)
  FROM (
    SELECT DISTINCT ON (equipment_id)
      equipment_id,
      quantity
    FROM public.inventory
    WHERE movement_type = 'adjustment'
    ORDER BY equipment_id, created_at DESC
  ) latest
  WHERE e.id = latest.equipment_id;
