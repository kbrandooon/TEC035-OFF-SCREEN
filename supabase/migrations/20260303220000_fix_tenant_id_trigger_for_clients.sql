-- =============================================================================
-- Migration: fix_tenant_id_trigger_for_clients
-- Date: 2026-03-03
-- Purpose:
--   The `set_tenant_id_from_jwt` trigger always overwrites tenant_id with the
--   JWT claim, even when the caller (e.g. a SECURITY DEFINER RPC) provides
--   an explicit tenant_id. This breaks client reservation inserts because
--   clients have no `tenant_id` in their JWT.
--
--   Fix: if NEW.tenant_id is already set, leave it alone and return early.
--   The trigger will still auto-populate tenant_id from the JWT for all
--   admin inserts that don't provide it explicitly.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_tenant_id_from_jwt()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- If tenant_id was explicitly provided (e.g. by a SECURITY DEFINER RPC),
  -- trust it and skip the JWT extraction.
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- For admin inserts: extract from JWT app_metadata claim.
  v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot determine tenant_id from JWT. Is the user authenticated?';
  END IF;

  NEW.tenant_id := v_tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
