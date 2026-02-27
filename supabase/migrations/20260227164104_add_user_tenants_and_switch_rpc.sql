-- 1. Create user_tenants junction table (many-to-many: user ↔ tenant)
CREATE TABLE public.user_tenants (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, tenant_id)
);

-- 2. Migrate existing associations from profiles.tenant_id
INSERT INTO public.user_tenants (user_id, tenant_id)
SELECT id, tenant_id FROM public.profiles
ON CONFLICT DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: users can only see their own tenant memberships
CREATE POLICY "Users can view their own tenant memberships"
ON public.user_tenants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tenant memberships"
ON public.user_tenants FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 5. RPC: Get all tenants for the authenticated user
CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.slug, t.created_at
    FROM public.tenants t
    INNER JOIN public.user_tenants ut ON t.id = ut.tenant_id
    WHERE ut.user_id = auth.uid()
    ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Switch active tenant (updates JWT app_metadata)
CREATE OR REPLACE FUNCTION public.switch_active_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Security check: verify the calling user actually belongs to the target tenant
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_tenants
        WHERE user_id = auth.uid()
          AND tenant_id = p_tenant_id
    ) THEN
        RAISE EXCEPTION 'Access denied: you do not belong to tenant %', p_tenant_id;
    END IF;

    -- Update JWT claims: set new active tenant_id
    UPDATE auth.users
    SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('tenant_id', p_tenant_id)
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update create_new_tenant_with_admin to also insert into user_tenants
-- DROP first to avoid "cannot change return type of existing function" error
DROP FUNCTION IF EXISTS public.create_new_tenant_with_admin(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_new_tenant_with_admin(
    p_tenant_name TEXT,
    p_first_name TEXT,
    p_last_name TEXT
)
RETURNS VOID AS $$
DECLARE
    v_tenant_id UUID;
    v_admin_role_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Create the new tenant
    INSERT INTO public.tenants (name, slug)
    VALUES (
        p_tenant_name,
        lower(regexp_replace(p_tenant_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substring(gen_random_uuid()::text, 1, 8)
    )
    RETURNING id INTO v_tenant_id;

    -- Get the admin role ID
    SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin';

    -- Check if a profile exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
        -- Update the existing profile
        UPDATE public.profiles
        SET tenant_id = v_tenant_id,
            first_name = COALESCE(NULLIF(p_first_name, ''), first_name),
            last_name = COALESCE(NULLIF(p_last_name, ''), last_name),
            updated_at = now()
        WHERE id = v_user_id;
    ELSE
        -- Create a new profile
        INSERT INTO public.profiles (id, tenant_id, email, first_name, last_name)
        SELECT v_user_id, v_tenant_id, email, p_first_name, p_last_name
        FROM auth.users WHERE id = v_user_id;
    END IF;

    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_user_id, v_admin_role_id)
    ON CONFLICT DO NOTHING;

    -- Register user_tenant membership
    INSERT INTO public.user_tenants (user_id, tenant_id)
    VALUES (v_user_id, v_tenant_id)
    ON CONFLICT DO NOTHING;

    -- Update JWT claims
    UPDATE auth.users
    SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
            'tenant_id', v_tenant_id,
            'role', 'admin'
        )
    WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
