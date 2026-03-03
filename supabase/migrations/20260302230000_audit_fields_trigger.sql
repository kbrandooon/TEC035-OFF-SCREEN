-- =============================================================
-- Audit trail trigger: auto-populate created_at, created_by,
-- updated_at, updated_by on INSERT and UPDATE for all tables.
--
-- created_by / updated_by are set to the authenticated user's
-- email from the JWT (app_metadata.email or email claim).
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Resolve user email from JWT claims
  v_user_email := COALESCE(
    auth.jwt() ->> 'email',
    (auth.jwt() -> 'app_metadata' ->> 'email'),
    'system'
  );

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, timezone('utc', now()));
    NEW.created_by := COALESCE(NEW.created_by, v_user_email);
    NEW.updated_at := timezone('utc', now());
    NEW.updated_by := v_user_email;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Preserve original created_at / created_by
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    NEW.updated_at := timezone('utc', now());
    NEW.updated_by := v_user_email;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Attach to all domain tables ───────────────────────────────

CREATE TRIGGER audit_customers
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER audit_equipment
  BEFORE INSERT OR UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER audit_reservations
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER audit_inventory
  BEFORE INSERT OR UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
