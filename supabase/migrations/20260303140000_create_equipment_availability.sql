-- =============================================================================
-- Migration: create_equipment_availability
-- Date: 2026-03-03
-- Purpose:
--   Implements the Equipment Availability Engine for Off Screen.
--   Mirrors the pattern from TEC015 (get_product_availability) but adapted
--   for TEC035's schema where equipment items are stored as a JSONB array
--   inside the `reservations.equipment_items` column.
--
--   Two objects are created:
--   1. `v_equipment_reservations` — flattens the JSONB into one row per
--      (reservation, equipment_item), with a tsrange built from date+time fields.
--   2. `get_equipment_availability(p_start, p_end, p_type?)` — RPC that uses the
--      `&&` overlap operator to find committed quantities for a query window and
--      returns available = quantity - committed for every active equipment item.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- View: v_equipment_reservations
-- Unnests the JSONB equipment_items array into flat rows so that the RPC can
-- use simple set operations instead of JSON operations inline.
-- Each row represents a single equipment item inside one reservation with a
-- computed tsrange [start_datetime, end_datetime].
-- security_invoker = true → RLS on `reservations` applies automatically.
-- -----------------------------------------------------------------------------
drop view if exists public.v_equipment_reservations;
create or replace view public.v_equipment_reservations
  with (security_invoker = true)
as
  select
    r.id                                  as reservation_id,
    r.tenant_id,
    (item ->> 'equipmentId')::uuid        as equipment_id,
    (item ->> 'quantity')::integer        as quantity,
    tsrange(
      (r.date::text  || ' ' || r.start_time)::timestamp,
      (r.end_date::text || ' ' || r.end_time)::timestamp,
      '[]'
    )                                     as occupied_range
  from public.reservations r,
       jsonb_array_elements(r.equipment_items) as item
  where r.status in ('pending', 'confirmed')
    -- Guard: skip rows where equipment_items is null or empty
    and jsonb_array_length(r.equipment_items) > 0;

grant select on public.v_equipment_reservations to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: get_equipment_availability
-- Calculates how many units of each equipment item are available in the
-- requested time window using PostgreSQL's native tsrange && operator.
--
-- Formula: available = equipment.quantity - SUM(committed in window)
-- Results are scoped to the calling user's tenant via RLS on v_equipment_reservations
-- and the equipment table.
--
-- Parameters:
--   p_start  - Start of the inquiry window (ISO 8601 timestamp).
--   p_end    - End of the inquiry window (ISO 8601 timestamp).
--   p_type   - Optional equipment type to filter results.
-- -----------------------------------------------------------------------------
create or replace function public.get_equipment_availability(
  p_start  timestamptz,
  p_end    timestamptz,
  p_type   text default null
)
returns table (
  id        uuid,
  name      text,
  type      text,
  quantity  integer,
  committed bigint,
  available bigint
)
language plpgsql
stable
security invoker
as $$
begin
  return query
  select
    e.id,
    e.name,
    e.type::text,
    e.quantity,

    -- Total units committed in the inquiry window
    coalesce(sum(er.quantity), 0)::bigint                                   as committed,

    -- Available = owned quantity minus committed, floored at 0
    greatest(
      e.quantity::bigint - coalesce(sum(er.quantity), 0)::bigint,
      0
    )                                                                       as available

  from public.equipment e
  left join public.v_equipment_reservations er
         on er.equipment_id  = e.id
        and er.occupied_range && tsrange(p_start::timestamp, p_end::timestamp, '[]')

  where e.status = 'disponible'
    and (p_type is null or e.type::text = p_type)

  group by e.id, e.name, e.type, e.quantity
  order by e.name;
end;
$$;
