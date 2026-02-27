-- =============================================================================
-- Tenant Invitations: invite employees to join a studio
-- =============================================================================

-- ─── 1. Invitations table ─────────────────────────────────────────────────────
CREATE TABLE public.tenant_invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES public.tenants(id)  ON DELETE CASCADE NOT NULL,
    role_id     UUID REFERENCES public.roles(id)     ON DELETE RESTRICT NOT NULL,
    invited_by  UUID REFERENCES auth.users(id)        ON DELETE SET NULL,
    email       TEXT NOT NULL,
    token       UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at  TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_pending_invite UNIQUE (tenant_id, email)
);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Tenant admins can view invitations for their tenant
CREATE POLICY "invitations_select"
ON public.tenant_invitations FOR SELECT
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);

-- Tenant admins can create invitations
CREATE POLICY "invitations_insert_admins"
ON public.tenant_invitations FOR INSERT
WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);

-- Tenant admins can delete (revoke) invitations
CREATE POLICY "invitations_delete_admins"
ON public.tenant_invitations FOR DELETE
USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
);

-- ─── 2. RPC: get_tenant_employees ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_tenant_employees()
RETURNS TABLE (
    user_id    UUID,
    email      TEXT,
    first_name TEXT,
    last_name  TEXT,
    is_active  BOOLEAN,
    role_name  TEXT,
    joined_at  TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id          AS user_id,
        p.email,
        p.first_name,
        p.last_name,
        p.is_active,
        r.name        AS role_name,
        tm.created_at AS joined_at
    FROM public.tenant_members tm
    JOIN public.profiles p ON tm.user_id = p.id
    JOIN public.roles r    ON tm.role_id = r.id
    WHERE tm.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    ORDER BY tm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. RPC: get_pending_invitations ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_pending_invitations()
RETURNS TABLE (
    id         UUID,
    email      TEXT,
    role_name  TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ti.id,
        ti.email,
        r.name AS role_name,
        ti.expires_at,
        ti.created_at
    FROM public.tenant_invitations ti
    JOIN public.roles r ON ti.role_id = r.id
    WHERE ti.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
      AND ti.accepted_at IS NULL
      AND ti.expires_at > now()
    ORDER BY ti.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. RPC: invite_member ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.invite_member(
    p_email   TEXT,
    p_role_id UUID
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_token     UUID;
BEGIN
    v_tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;

    -- Only admins can invite
    IF (auth.jwt() -> 'app_metadata' ->> 'role')::text != 'admin' THEN
        RAISE EXCEPTION 'Only admins can invite members';
    END IF;

    -- Check the user isn't already a member of this tenant
    IF EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.tenant_members tm ON p.id = tm.user_id
        WHERE lower(p.email) = lower(p_email)
          AND tm.tenant_id = v_tenant_id
    ) THEN
        RAISE EXCEPTION 'User % is already a member of this tenant', p_email;
    END IF;

    -- Upsert invitation (resend resets token and expiry)
    INSERT INTO public.tenant_invitations (tenant_id, role_id, invited_by, email)
    VALUES (v_tenant_id, p_role_id, auth.uid(), lower(p_email))
    ON CONFLICT (tenant_id, email) DO UPDATE
        SET role_id    = p_role_id,
            invited_by = auth.uid(),
            token      = gen_random_uuid(),
            expires_at = now() + interval '7 days',
            accepted_at = NULL,
            created_at = now()
    RETURNING token INTO v_token;

    RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. RPC: get_invitation_by_token (public, no auth needed) ─────────────────
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token UUID)
RETURNS TABLE (
    email     TEXT,
    role_name TEXT,
    tenant_name TEXT,
    is_valid  BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ti.email,
        r.name     AS role_name,
        t.name     AS tenant_name,
        (ti.accepted_at IS NULL AND ti.expires_at > now()) AS is_valid
    FROM public.tenant_invitations ti
    JOIN public.roles r   ON ti.role_id   = r.id
    JOIN public.tenants t ON ti.tenant_id = t.id
    WHERE ti.token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. RPC: accept_invitation ────────────────────────────────────────────────
-- Called AFTER the new employee has signed up via supabase.auth.signUp.
-- Links the newly created user to the tenant using the invitation token.
CREATE OR REPLACE FUNCTION public.accept_invitation(
    p_token      UUID,
    p_first_name TEXT,
    p_last_name  TEXT,
    p_phone      TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_invitation   public.tenant_invitations%ROWTYPE;
    v_user_id      UUID;
    v_user_email   TEXT;
BEGIN
    v_user_id    := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Fetch and validate invitation
    SELECT * INTO v_invitation
    FROM public.tenant_invitations
    WHERE token = p_token
      AND accepted_at IS NULL
      AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation is invalid or has expired';
    END IF;

    -- Verify the email matches the authenticated user
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    IF lower(v_user_email) != lower(v_invitation.email) THEN
        RAISE EXCEPTION 'This invitation was sent to a different email address';
    END IF;

    -- Upsert the user's profile
    INSERT INTO public.profiles (id, tenant_id, email, first_name, last_name)
    VALUES (v_user_id, v_invitation.tenant_id, v_invitation.email, p_first_name, p_last_name)
    ON CONFLICT (id) DO UPDATE
        SET tenant_id  = v_invitation.tenant_id,
            first_name = COALESCE(NULLIF(trim(p_first_name), ''), profiles.first_name),
            last_name  = COALESCE(NULLIF(trim(p_last_name),  ''), profiles.last_name),
            updated_at = now();

    -- Register membership
    INSERT INTO public.tenant_members (user_id, tenant_id, role_id)
    VALUES (v_user_id, v_invitation.tenant_id, v_invitation.role_id)
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET role_id = v_invitation.role_id;

    -- Mark invitation as accepted
    UPDATE public.tenant_invitations
    SET accepted_at = now()
    WHERE id = v_invitation.id;

    -- Update JWT claims so the user can use the app immediately
    UPDATE auth.users
    SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
            'tenant_id', v_invitation.tenant_id,
            'role', (SELECT name FROM public.roles WHERE id = v_invitation.role_id)
        )
    WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
