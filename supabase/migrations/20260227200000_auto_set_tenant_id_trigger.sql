-- =============================================================
-- Auto-populate `tenant_id` from the JWT claim on INSERT for
-- all tables that require tenant isolation.
-- This prevents RLS WITH CHECK failures when the client does
-- not explicitly pass tenant_id.
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_tenant_id_from_jwt()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Extract tenant_id from the JWT app_metadata claim
  v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cannot determine tenant_id from JWT. Is the user authenticated?';
  END IF;

  NEW.tenant_id := v_tenant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Attach trigger to all tenant-scoped tables ───────────────

CREATE TRIGGER set_tenant_id_on_customers
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_jwt();

CREATE TRIGGER set_tenant_id_on_equipment
  BEFORE INSERT ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_jwt();

CREATE TRIGGER set_tenant_id_on_reservations
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_jwt();

CREATE TRIGGER set_tenant_id_on_inventory
  BEFORE INSERT ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_jwt();
