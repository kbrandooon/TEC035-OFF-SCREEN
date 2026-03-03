-- =============================================================================
-- Migration: create_api_views
-- Date: 2026-03-03
-- Purpose:
--   Creates three read-only views to replace PostgREST inline joins and
--   client-side aggregation logic in the API layer. All views are security
--   DEFINER so they inherit the session's RLS context from the base tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- View: v_reservations
-- Joins `reservations` with `customers` to expose the client's full name.
-- Eliminates the `customers!reservations_customer_id_fkey(names, last_name)`
-- PostgREST lateral join that was inlined in `get-reservations.ts`.
-- -----------------------------------------------------------------------------
create or replace view v_reservations as
  select
    r.id,
    r.tenant_id,
    r.date,
    r.end_date,
    r.start_time,
    r.end_time,
    r.customer_id,
    c.names         as customer_names,
    c.last_name     as customer_last_name,
    r.address,
    r.notes,
    r.requires_invoice,
    r.equipment_items,
    r.status,
    r.created_at
  from reservations r
  left join customers c on c.id = r.customer_id;

-- Allow authenticated users to query this view (RLS on base tables still applies).
grant select on v_reservations to authenticated;

-- -----------------------------------------------------------------------------
-- View: v_inventory_movements
-- Joins `inventory` (movements) with `equipment` to expose the item name.
-- Eliminates the `equipment(name)` PostgREST join inlined in `get-inventory.ts`.
-- -----------------------------------------------------------------------------
create or replace view v_inventory_movements as
  select
    i.id,
    i.tenant_id,
    i.equipment_id,
    e.name          as equipment_name,
    i.date,
    i.movement_type,
    i.quantity,
    i.clasification,
    i.description,
    i.created_at,
    i.created_by
  from inventory i
  left join equipment e on e.id = i.equipment_id;

grant select on v_inventory_movements to authenticated;

-- -----------------------------------------------------------------------------
-- View: v_equipment_stats
-- Aggregates `equipment` rows by type to produce available / total stock counts.
-- Replaces the client-side reduce loop that was in `get-equipment-stats.ts`.
-- -----------------------------------------------------------------------------
create or replace view v_equipment_stats as
  select
    type,
    sum(quantity)                                          as total,
    sum(quantity) filter (where status = 'disponible')     as available
  from equipment
  group by type;

grant select on v_equipment_stats to authenticated;
