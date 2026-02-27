-- =============================================================================
-- REFACTOR: Merge user_roles + user_tenants → tenant_members
-- FIX: profiles RLS — profile belongs to user, not tenant
-- =============================================================================

-- ─── 1. Create tenant_members (replaces user_roles + user_tenants) ────────────
CREATE TABLE public.tenant_members (
    user_id   UUID REFERENCES auth.users(id)    ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    role_id   UUID REFERENCES public.roles(id)   ON DELETE RESTRICT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, tenant_id)
);

-- ─── 2. Migrate existing data ─────────────────────────────────────────────────
-- Combine user_tenants (membership) with user_roles (role) into one row.
-- For users in user_tenants, we match their role from user_roles (or default to 'admin').
INSERT INTO public.tenant_members (user_id, tenant_id, role_id)
SELECT
    ut.user_id,
    ut.tenant_id,
    COALESCE(
        (
            SELECT ur.role_id
            FROM public.user_roles ur
            WHERE ur.user_id = ut.user_id
            LIMIT 1
        ),
        (SELECT id FROM public.roles WHERE name = 'admin')
    ) AS role_id
FROM public.user_tenants ut
ON CONFLICT DO NOTHING;

-- ─── 3. Drop old triggers that reference user_roles ──────────────────────────
DROP TRIGGER IF EXISTS on_profile_created_or_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_user_role_created_or_updated ON public.user_roles;

-- ─── 4. Drop old tables ───────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.user_tenants;

-- ─── 5. Enable RLS on tenant_members ─────────────────────────────────────────
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Users can see all members of their active tenant
CREATE POLICY "tenant_members_select"
ON public.tenant_members FOR SELECT
USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
);

-- Only admins can manage memberships
CREATE POLICY "tenant_members_all_admins"
ON public.tenant_members FOR ALL
USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
)
WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);

-- ─── 6. Fix profiles RLS ──────────────────────────────────────────────────────
-- A profile belongs to a USER, not a tenant. The old policies used tenant_id
-- which broke when a user switched to a second tenant (their profile has the
-- original tenant_id, not the active JWT's tenant_id).

-- Drop old policies
DROP POLICY IF EXISTS "Tenant isolation for profiles - SELECT" ON public.profiles;
DROP POLICY IF EXISTS "Tenant isolation for profiles - ALL (Admins)" ON public.profiles;

-- Users can always read their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Users in the same active tenant can see each other's profiles
CREATE POLICY "profiles_select_tenant_peers"
ON public.profiles FOR SELECT
USING (
    id IN (
        SELECT user_id
        FROM public.tenant_members
        WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    )
);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can manage all profiles in their active tenant
CREATE POLICY "profiles_all_admins"
ON public.profiles FOR ALL
USING (
    id IN (
        SELECT user_id
        FROM public.tenant_members
        WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    )
    AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
)
WITH CHECK (
    id IN (
        SELECT user_id
        FROM public.tenant_members
        WHERE tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    )
    AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);

-- ─── 7. Fix old user_roles SELECT policy on tenants (references user_roles) ──
DROP POLICY IF EXISTS "Tenant isolation for user_roles - SELECT" ON public.tenants;
DROP POLICY IF EXISTS "Tenant isolation for user_roles - ALL (Admins)" ON public.tenants;

-- ─── 8. Update JWT trigger to use tenant_members ─────────────────────────────
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
            'role', COALESCE(v_role_name, 'viewer')
        )
    WHERE id = v_target_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE CONSTRAINT TRIGGER on_profile_created_or_updated
    AFTER INSERT OR UPDATE OF tenant_id ON public.profiles
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.update_user_jwt_claims();

CREATE CONSTRAINT TRIGGER on_tenant_member_created_or_updated
    AFTER INSERT OR UPDATE OF role_id ON public.tenant_members
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public.update_user_jwt_claims();

-- ─── 9. Update RPCs to use tenant_members ────────────────────────────────────

DROP FUNCTION IF EXISTS public.create_new_tenant_with_admin(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_new_tenant_with_admin(
    p_tenant_name TEXT,
    p_first_name  TEXT,
    p_last_name   TEXT
) RETURNS VOID AS $$
DECLARE
    v_tenant_id    UUID;
    v_admin_role_id UUID;
    v_user_id      UUID;
    v_email        TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF length(trim(p_tenant_name)) < 2 THEN
        RAISE EXCEPTION 'Tenant name must be at least 2 characters';
    END IF;

    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

    -- Create the new tenant
    INSERT INTO public.tenants (name, slug)
    VALUES (
        p_tenant_name,
        lower(regexp_replace(p_tenant_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substring(gen_random_uuid()::text, 1, 8)
    )
    RETURNING id INTO v_tenant_id;

    SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin';

    -- Upsert profile (create if first studio, update tenant if switching context)
    INSERT INTO public.profiles (id, tenant_id, email, first_name, last_name)
    VALUES (v_user_id, v_tenant_id, v_email,
            NULLIF(trim(p_first_name), ''),
            NULLIF(trim(p_last_name), ''))
    ON CONFLICT (id) DO UPDATE
        SET tenant_id  = v_tenant_id,
            first_name = COALESCE(NULLIF(trim(p_first_name), ''), profiles.first_name),
            last_name  = COALESCE(NULLIF(trim(p_last_name),  ''), profiles.last_name),
            updated_at = now();

    -- Register membership with admin role
    INSERT INTO public.tenant_members (user_id, tenant_id, role_id)
    VALUES (v_user_id, v_tenant_id, v_admin_role_id)
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET role_id = v_admin_role_id;

    -- Update JWT claims
    UPDATE auth.users
    SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('tenant_id', v_tenant_id, 'role', 'admin')
    WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_my_tenants to use tenant_members
CREATE OR REPLACE FUNCTION public.get_my_tenants()
RETURNS TABLE (id UUID, name TEXT, slug TEXT, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.slug, t.created_at
    FROM public.tenants t
    INNER JOIN public.tenant_members tm ON t.id = tm.tenant_id
    WHERE tm.user_id = auth.uid()
    ORDER BY t.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update switch_active_tenant to use tenant_members
CREATE OR REPLACE FUNCTION public.switch_active_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
    v_role_name TEXT;
BEGIN
    -- Verify membership
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_members
        WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
    ) THEN
        RAISE EXCEPTION 'Access denied: you do not belong to tenant %', p_tenant_id;
    END IF;

    -- Get the user's role in this specific tenant
    SELECT r.name INTO v_role_name
    FROM public.tenant_members tm
    JOIN public.roles r ON tm.role_id = r.id
    WHERE tm.user_id = auth.uid() AND tm.tenant_id = p_tenant_id;

    -- Update JWT
    UPDATE auth.users
    SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
            'tenant_id', p_tenant_id,
            'role', COALESCE(v_role_name, 'viewer')
        )
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
