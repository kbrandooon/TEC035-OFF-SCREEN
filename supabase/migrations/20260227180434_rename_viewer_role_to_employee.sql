-- =============================================================================
-- Rename 'viewer' role to 'employee'
-- =============================================================================

-- 1. Rename in roles table (FK refs use id, so only the label changes)
UPDATE public.roles
SET name = 'employee'
WHERE name = 'viewer';

-- 2. Fix the JWT trigger function: update the COALESCE default fallback
CREATE OR REPLACE FUNCTION public.update_user_jwt_claims()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_role_name  TEXT;
    v_target_id  UUID;
BEGIN
    IF TG_TABLE_NAME = 'profiles' THEN
        v_target_id := NEW.id;
        v_tenant_id := NEW.tenant_id;

        SELECT r.name INTO v_role_name
        FROM public.tenant_members tm
        JOIN public.roles r ON tm.role_id = r.id
        WHERE tm.user_id = v_target_id
          AND tm.tenant_id = v_tenant_id
        LIMIT 1;

    ELSIF TG_TABLE_NAME = 'tenant_members' THEN
        v_target_id := NEW.user_id;
        v_tenant_id := NEW.tenant_id;

        SELECT name INTO v_role_name
        FROM public.roles
        WHERE id = NEW.role_id;
    END IF;

    UPDATE auth.users
    SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb) ||
        jsonb_build_object(
            'tenant_id', v_tenant_id,
            'role', COALESCE(v_role_name, 'employee')   -- was 'viewer'
        )
    WHERE id = v_target_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix switch_active_tenant RPC fallback
CREATE OR REPLACE FUNCTION public.switch_active_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_members
        WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
    ) THEN
        RAISE EXCEPTION 'Access denied: you do not belong to tenant %', p_tenant_id;
    END IF;

    SELECT r.name INTO v_role_name
    FROM public.tenant_members tm
    JOIN public.roles r ON tm.role_id = r.id
    WHERE tm.user_id = auth.uid() AND tm.tenant_id = p_tenant_id;

    UPDATE auth.users
    SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
            'tenant_id', p_tenant_id,
            'role', COALESCE(v_role_name, 'employee')   -- was 'viewer'
        )
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
