-- =============================================================================
-- Migration: fix_client_reservation_rpc_full
-- Date: 2026-03-03
-- Purpose:
--   Full update to create_client_reservation RPC:
--   - Adds p_start_time, p_end_time parameters (stored in start_time/end_time columns)
--   - Adds p_equipment_items JSONB parameter (stored in equipment_items column)
--   - Keeps date = p_start_date to satisfy NOT NULL constraint
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_client_reservation(
  p_client_profile_id UUID,
  p_equipment_id      UUID,
  p_tenant_id         UUID,
  p_start_date        DATE,
  p_end_date          DATE,
  p_start_time        TEXT DEFAULT '09:00',
  p_end_time          TEXT DEFAULT '18:00',
  p_equipment_items   JSONB DEFAULT '[]'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'cliente' THEN
    RAISE EXCEPTION 'Only cliente users can call this function';
  END IF;

  IF p_client_profile_id != auth.uid() THEN
    RAISE EXCEPTION 'client_profile_id must match the authenticated user';
  END IF;

  INSERT INTO public.reservations (
    client_profile_id,
    equipment_id,
    tenant_id,
    date,
    start_date,
    end_date,
    start_time,
    end_time,
    equipment_items,
    status
  )
  VALUES (
    p_client_profile_id,
    p_equipment_id,
    p_tenant_id,
    p_start_date,
    p_start_date,
    p_end_date,
    p_start_time::TIME,
    p_end_time::TIME,
    p_equipment_items,
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_client_reservation(UUID, UUID, UUID, DATE, DATE, TEXT, TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.create_client_reservation(UUID, UUID, UUID, DATE, DATE, TEXT, TEXT, JSONB) TO authenticated;
