-- =============================================================================
-- Migration: patch_today_equipment_stats_full_day_window
-- Date: 2026-03-03
-- Purpose:
--   Patches the `get_today_equipment_stats` RPC created in 20260303150000.
--   Changes the time window start from `now()` to `current_date::timestamp`
--   (midnight of today) so that reservations starting earlier in the day
--   are correctly included in the committed count.
--
--   Before: tsrange(now()::timestamp, end_of_today)   ← missed past-time reservations
--   After:  tsrange(current_date::timestamp, end_of_today)  ← full day window
-- =============================================================================

create or replace function public.get_today_equipment_stats()
returns table (
  type            text,
  total           bigint,
  today_available bigint
)
language sql
stable
security invoker
as $$
  with
  -- All active equipment units (exclude permanently unavailable)
  stock as (
    select
      e.type::text  as type,
      e.id          as equipment_id,
      e.quantity
    from public.equipment e
    where e.status != 'no_disponible'
  ),

  -- Units committed in reservations that overlap ANY part of today
  committed_today as (
    select
      s.type,
      coalesce(sum(er.quantity), 0)::bigint as committed
    from stock s
    left join public.v_equipment_reservations er
           on er.equipment_id = s.equipment_id
          and er.occupied_range &&
              tsrange(
                current_date::timestamp,
                (current_date + interval '1 day - 1 second')::timestamp,
                '[]'
              )
    group by s.type
  ),

  -- Total stock per type
  totals as (
    select type, sum(quantity)::bigint as total
    from   stock
    group  by type
  )

  select
    t.type,
    t.total,
    greatest(t.total - c.committed, 0) as today_available
  from   totals t
  join   committed_today c using (type)
  order  by t.type;
$$;
