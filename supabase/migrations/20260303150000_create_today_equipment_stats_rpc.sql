-- =============================================================================
-- Migration: create_today_equipment_stats_rpc
-- Date: 2026-03-03
-- Purpose:
--   Creates a dynamic RPC that calculates per-type equipment availability for
--   TODAY by subtracting units committed in active reservations from the total.
--
--   The old v_equipment_stats view used status='disponible' (a static flag).
--   This RPC reuses v_equipment_reservations with [now, end_of_today] to give
--   a truly live "available today" count per equipment type.
--
--   Formula: today_available = total_quantity_of_type - SUM(committed_today_of_type)
--   Results are scoped to the caller's tenant via RLS on base tables.
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
  -- All active equipment units grouped by type (exclude permanently unavailable)
  stock as (
    select
      e.type::text  as type,
      e.id          as equipment_id,
      e.quantity
    from public.equipment e
    where e.status != 'no_disponible'
  ),

  -- Units committed in any reservation that overlaps TODAY
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

grant execute on function public.get_today_equipment_stats() to authenticated;
