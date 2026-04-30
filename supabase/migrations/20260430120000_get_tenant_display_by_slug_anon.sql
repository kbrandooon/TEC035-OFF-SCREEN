-- =============================================================================
-- Public reserve gate (pre-Google): expose only studio display name by slug
-- so anonymous visitors see a friendly label. Slug is already public (URL).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_tenant_display_by_slug_public(p_slug TEXT)
RETURNS TABLE (
  name TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.name
  FROM public.tenants t
  WHERE t.slug = p_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_tenant_display_by_slug_public(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_display_by_slug_public(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_tenant_display_by_slug_public(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_tenant_display_by_slug_public(TEXT) IS
  'Reserve gate: studio display name for slug; callable without session.';
