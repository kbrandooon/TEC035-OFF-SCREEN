-- =============================================================================
-- Migration: fix_client_reservation_rpc_date
-- Date: 2026-03-03
-- Purpose:
--   The `date` column on reservations is NOT NULL (used by admin reservations).
--   Client reservations must also populate it; we use p_start_date as the value.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_client_reservation(
  p_client_profile_id UUID,
  p_equipment_id      UUID,
  p_tenant_id         UUID,
  p_start_date        DATE,
  p_end_date          DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id UUID;
BEGIN
  -- Verify the caller is an authenticated cliente
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'cliente' THEN
    RAISE EXCEPTION 'Only cliente users can call this function';
  END IF;

  -- Verify the client_profile_id matches the caller
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
    status
  )
  VALUES (
    p_client_profile_id,
    p_equipment_id,
    p_tenant_id,
    p_start_date,   -- date (NOT NULL) = rental start date
    p_start_date,
    p_end_date,
    'pending'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_client_reservation(UUID, UUID, UUID, DATE, DATE) FROM public;
GRANT EXECUTE ON FUNCTION public.create_client_reservation(UUID, UUID, UUID, DATE, DATE) TO authenticated;
