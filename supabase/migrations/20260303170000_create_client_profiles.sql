-- =============================================================================
-- Client Profiles Table
-- Stores personal info for users who register as 'cliente' (NOT studio admins).
-- These users are independent: they have no tenant_id.
-- =============================================================================

CREATE TABLE public.client_profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    phone      TEXT,
    email      TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile only
CREATE POLICY "client_profiles_select_own"
ON public.client_profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "client_profiles_update_own"
ON public.client_profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =============================================================================
-- RPC: save_client_profile
-- Upserts a client profile for the currently authenticated user.
-- Uses SECURITY DEFINER to bypass RLS on INSERT (needed because the JWT
-- does not yet have app_metadata claims at signup time).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.save_client_profile(
    p_first_name TEXT,
    p_last_name  TEXT,
    p_phone      TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_email   TEXT;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF length(trim(p_first_name)) < 1 OR length(trim(p_last_name)) < 1 THEN
        RAISE EXCEPTION 'First name and last name are required';
    END IF;

    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

    INSERT INTO public.client_profiles (id, first_name, last_name, phone, email)
    VALUES (v_user_id, trim(p_first_name), trim(p_last_name), NULLIF(trim(COALESCE(p_phone, '')), ''), v_email)
    ON CONFLICT (id) DO UPDATE
        SET first_name = trim(p_first_name),
            last_name  = trim(p_last_name),
            phone      = NULLIF(trim(COALESCE(p_phone, '')), ''),
            updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
