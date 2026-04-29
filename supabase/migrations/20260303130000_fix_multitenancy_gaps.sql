-- =============================================================================
-- Migration: fix_multitenancy_gaps
-- Date: 2026-03-03
-- Purpose:
--   Hardens the API views by setting `security_invoker = true`.
--   This ensures that the views respect the Row Level Security (RLS)
--   policies of the underlying tables (reservations, customers, equipment, etc.)
--   preventing any potential data leakage between tenants.
-- =============================================================================

-- 1. Re-create v_reservations with security_invoker
drop view if exists v_reservations;
create view v_reservations with (security_invoker = true) as
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

grant select on v_reservations to authenticated;

-- 2. Re-create v_inventory_movements with security_invoker
drop view if exists v_inventory_movements;
create view v_inventory_movements with (security_invoker = true) as
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

-- 3. Re-create v_equipment_stats with security_invoker and tenant_id
drop view if exists v_equipment_stats;
create view v_equipment_stats with (security_invoker = true) as
  select
    tenant_id,
    type,
    sum(quantity)                                          as total,
    sum(quantity) filter (where status = 'disponible')     as available
  from equipment
  group by tenant_id, type;

grant select on v_equipment_stats to authenticated;
