-- =============================================================================
-- Fix 22023 "cannot get array length of a scalar" on
-- get_equipment_availability_for_reserve_slug when reservations.equipment_items
-- holds a non-array JSON value. PG may evaluate jsonb_array_length / elements
-- before jsonb_typeof filters; use CASE + LATERAL so only arrays are unnested.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_equipment_availability_for_reserve_slug(
  p_slug   TEXT,
  p_start  TIMESTAMPTZ,
  p_end    TIMESTAMPTZ,
  p_type   TEXT DEFAULT NULL
)
RETURNS TABLE (
  id        UUID,
  name      TEXT,
  type      TEXT,
  quantity  INTEGER,
  committed BIGINT,
  available BIGINT
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = p_slug
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.type::TEXT,
    e.quantity,
    COALESCE(SUM(er.quantity), 0)::BIGINT AS committed,
    GREATEST(
      e.quantity::BIGINT - COALESCE(SUM(er.quantity), 0)::BIGINT,
      0
    ) AS available
  FROM public.equipment e
  LEFT JOIN (
    SELECT
      (item ->> 'equipmentId')::UUID AS equipment_id,
      (item ->> 'quantity')::INTEGER AS quantity,
      tsrange(
        (rf.date::TEXT || ' ' || rf.start_time)::TIMESTAMP,
        (rf.end_date::TEXT || ' ' || rf.end_time)::TIMESTAMP,
        '[]'
      ) AS occupied_range
    FROM public.reservations rf
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(rf.equipment_items) = 'array'
        THEN rf.equipment_items
        ELSE '[]'::JSONB
      END
    ) AS item
    WHERE rf.tenant_id = v_tenant_id
      AND rf.status IN ('pending', 'confirmed')
  ) er
    ON er.equipment_id = e.id
   AND er.occupied_range && tsrange(p_start::TIMESTAMP, p_end::TIMESTAMP, '[]')
  WHERE e.tenant_id = v_tenant_id
    AND e.status = 'disponible'
    AND (p_type IS NULL OR e.type::TEXT = p_type)
  GROUP BY e.id, e.name, e.type, e.quantity
  ORDER BY e.name;
END;
$$;
