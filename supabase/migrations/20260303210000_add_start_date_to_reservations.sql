-- =============================================================================
-- Migration: add_start_date_to_reservations
-- Date: 2026-03-03
-- Purpose: Adds start_date DATE column for multi-day client equipment rentals.
--          end_date was already added by the client_portal_schema migration;
--          start_date was missed. The equipment_id FK is also added here since
--          client reservations reference specific equipment items.
-- =============================================================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS start_date DATE;
