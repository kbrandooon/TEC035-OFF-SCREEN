-- =============================================================================
-- Migration: fix_equipment_availability_scalar_guard
-- Date: 2026-03-03
-- Purpose:
--   Patches `v_equipment_reservations` to prevent the Postgres error:
--     22023 "cannot get array length of a scalar"
--
--   Root cause:
--     The original view used `jsonb_array_length(r.equipment_items) > 0` as the
--     only guard. `jsonb_array_length()` throws 22023 when the JSONB value is
--     NOT an array (e.g. a scalar null, string, or object stored in that column).
--     Even though the column defaults to '[]', older or manually-inserted rows
--     can hold non-array values.
--
--   Fix:
--     Add `jsonb_typeof(r.equipment_items) = 'array'` BEFORE the length check.
--     Postgres short-circuits AND clauses left-to-right, so non-array values are
--     filtered out before `jsonb_array_length` is ever evaluated.
-- =============================================================================

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
    -- Guard: skip rows where equipment_items is not a JSON array or is empty.
    -- jsonb_typeof check MUST come first (short-circuit) to prevent 22023
    -- ("cannot get array length of a scalar") on non-array column values.
    and jsonb_typeof(r.equipment_items) = 'array'
    and jsonb_array_length(r.equipment_items) > 0;

grant select on public.v_equipment_reservations to authenticated;
