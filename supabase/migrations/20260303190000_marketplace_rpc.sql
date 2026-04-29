-- =============================================================================
-- Migration: marketplace_rpc
-- Date: 2026-03-03
-- Purpose:
--   Provides a SECURITY DEFINER function for the client marketplace.
--   Bypassing RLS is intentional here: equipment in the marketplace is
--   visible to all authenticated clients regardless of tenant affiliation.
--   The function filters retired items and joins tenant names.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_marketplace_equipment()
RETURNS TABLE (
  id          UUID,
  name        TEXT,
  type        TEXT,
  description TEXT,
  daily_rate  NUMERIC,
  status      TEXT,
  image_url   TEXT,
  tenant_id   UUID,
  tenant_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
-- Restrict who can call this function to authenticated users only
SET search_path = public
AS $$
  SELECT
    e.id,
    e.name,
    e.type::TEXT,
    e.description,
    e.daily_rate,
    e.status::TEXT,
    e.image_url,
    e.tenant_id,
    COALESCE(t.name, 'Estudio desconocido') AS tenant_name
  FROM public.equipment e
  LEFT JOIN public.tenants t ON t.id = e.tenant_id
  WHERE e.status != 'no_disponible'
  ORDER BY e.name;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.get_marketplace_equipment() FROM public;
GRANT EXECUTE ON FUNCTION public.get_marketplace_equipment() TO authenticated;
